import { useState, useEffect, useRef, useCallback } from "react";
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  ShieldCheck, Shield, AlertTriangle, Upload, CheckCircle2,
  Clock, FileText, User, CreditCard, Camera, Loader2, XCircle, Info,
} from "lucide-react";

type KycStatus = "unverified" | "submitted" | "verified" | "rejected";

interface KycData {
  kyc_status: KycStatus;
  kyc_deadline: string | null;
  kyc_verified_at: string | null;
  is_verified: boolean;
  grace_active: boolean;
  submission?: {
    full_name: string;
    id_type: string;
    status: string;
    submitted_at: string;
    admin_note?: string;
  } | null;
}

const ID_TYPES = [
  { value: "national_id",      label: "National ID" },
  { value: "passport",         label: "Passport" },
  { value: "driving_license",  label: "Driving License" },
];

function timeLeft(deadline: string | null): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Grace period expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function ImageUploader({
  label, hint, onChange, preview, required = false,
}: {
  label: string; hint: string; onChange: (b64: string) => void;
  preview: string | null; required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all hover:border-primary/60 hover:bg-primary/5 ${
          preview ? "border-safaricom/50 bg-safaricom/5" : "border-border bg-secondary/30"
        }`}
        style={{ minHeight: 140 }}
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-36 object-cover rounded-xl" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
            <Upload className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground font-medium">Click or drag to upload</p>
            <p className="text-xs text-muted-foreground/60">{hint}</p>
          </div>
        )}
        {preview && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-white text-sm font-semibold">Change image</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export default function DashboardKYC() {
  const { toast } = useToast();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName,    setFullName]    = useState("");
  const [idNumber,    setIdNumber]    = useState("");
  const [idType,      setIdType]      = useState("national_id");
  const [frontB64,    setFrontB64]    = useState<string | null>(null);
  const [backB64,     setBackB64]     = useState<string | null>(null);
  const [selfieB64,   setSelfieB64]   = useState<string | null>(null);

  const fetchKyc = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/kyc/status");
      if (data.status === "success") {
        setKyc(data);
        if (data.submission?.full_name) setFullName(data.submission.full_name);
        if (data.submission?.id_type)   setIdType(data.submission.id_type);
      }
    } catch { toast({ title: "Error", description: "Failed to load KYC status", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  const handleSubmit = async () => {
    if (!fullName.trim()) return toast({ title: "Required", description: "Enter your full legal name", variant: "destructive" });
    if (!idNumber.trim()) return toast({ title: "Required", description: "Enter your ID/passport number", variant: "destructive" });
    if (!frontB64)        return toast({ title: "Required", description: "Upload the front of your ID document", variant: "destructive" });

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/kyc/submit", {
        full_name: fullName.trim(),
        id_number: idNumber.trim(),
        id_type: idType,
        id_front_base64: frontB64,
        id_back_base64:  backB64  || undefined,
        selfie_base64:   selfieB64 || undefined,
      });
      if (data.status === "success") {
        toast({ title: "✅ KYC Submitted!", description: "We'll review your documents within 24 hours." });
        fetchKyc();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Submission failed. Please try again.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const statusConfig: Record<KycStatus, { icon: JSX.Element; color: string; bg: string; label: string }> = {
    unverified: { icon: <Clock className="w-5 h-5"   />, color: "text-warning",     bg: "from-warning/10",     label: "Unverified" },
    submitted:  { icon: <Shield className="w-5 h-5"  />, color: "text-primary",     bg: "from-primary/10",     label: "Under Review" },
    verified:   { icon: <ShieldCheck className="w-5 h-5"/>, color: "text-safaricom", bg: "from-safaricom/10",  label: "Verified ✓" },
    rejected:   { icon: <XCircle className="w-5 h-5" />, color: "text-destructive",  bg: "from-destructive/10", label: "Rejected" },
  };

  const sc = kyc ? statusConfig[kyc.kyc_status] : statusConfig.unverified;
  const canSubmit = !kyc?.is_verified && kyc?.kyc_status !== "submitted";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-0 md:ml-0 md:ml-20 lg:ml-64 pb-20 md:pb-0 transition-all duration-300 pb-20 md:pb-0">
        <DashboardHeader />
        <div className="p-4 md:p-6 lg:p-8 space-y-8">

          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-safaricom" />
              Account Verification (KYC)
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Verify your identity once — required to process payments on SwiftPay.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left — Status + Info */}
              <div className="space-y-5">

                {/* Status card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className={`glass rounded-xl p-5 bg-gradient-to-br ${sc.bg} to-transparent`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-background/40 ${sc.color}`}>{sc.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">Verification Status</p>
                      <p className={`font-bold text-lg ${sc.color}`}>{sc.label}</p>
                    </div>
                  </div>
                  {kyc?.kyc_status === "unverified" && kyc.kyc_deadline && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3" />
                      Grace period: <span className="font-semibold text-warning">{timeLeft(kyc.kyc_deadline)}</span>
                    </div>
                  )}
                  {kyc?.kyc_status === "submitted" && kyc.submission && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted {new Date(kyc.submission.submitted_at).toLocaleString("en-KE")}
                    </p>
                  )}
                  {kyc?.kyc_status === "verified" && kyc.kyc_verified_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Verified on {new Date(kyc.kyc_verified_at).toLocaleString("en-KE")}
                    </p>
                  )}
                  {kyc?.kyc_status === "rejected" && kyc.submission?.admin_note && (
                    <div className="mt-2 p-2 rounded-lg bg-destructive/10 text-xs text-destructive">
                      <strong>Reason:</strong> {kyc.submission.admin_note}
                    </div>
                  )}
                </motion.div>

                {/* Steps */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="glass rounded-xl p-5">
                  <h3 className="font-semibold mb-3 text-sm">What you need</h3>
                  {[
                    { icon: <User       className="w-4 h-4"/>, text: "Your full legal name" },
                    { icon: <CreditCard className="w-4 h-4"/>, text: "National ID, Passport, or Driving License" },
                    { icon: <FileText   className="w-4 h-4"/>, text: "Clear photo of the front of your ID" },
                    { icon: <FileText   className="w-4 h-4"/>, text: "Photo of the back (optional for passport)" },
                    { icon: <Camera     className="w-4 h-4"/>, text: "Selfie holding your ID (optional)" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 text-sm text-muted-foreground">
                      <span className="text-primary flex-shrink-0">{s.icon}</span>
                      {s.text}
                    </div>
                  ))}
                </motion.div>

                {/* Info box */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="glass rounded-xl p-4 bg-primary/5 border border-primary/20">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your documents are encrypted and stored securely. They are only used for identity verification and will never be shared with third parties.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right — Form or Verified state */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {kyc?.is_verified ? (
                    <motion.div key="verified" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-xl p-10 text-center">
                      <ShieldCheck className="w-16 h-16 text-safaricom mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-safaricom">Account Verified</h2>
                      <p className="text-muted-foreground mt-2">Your identity has been verified. You can accept payments on SwiftPay.</p>
                    </motion.div>

                  ) : kyc?.kyc_status === "submitted" ? (
                    <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-xl p-10 text-center">
                      <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h2 className="text-2xl font-bold">Documents Submitted</h2>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        Our team is reviewing your documents. This usually takes less than 24 hours.
                        You can still accept payments during the review period.
                      </p>
                      {kyc.submission && (
                        <div className="mt-6 glass rounded-xl p-4 text-left max-w-sm mx-auto text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name submitted</span>
                            <span className="font-medium">{kyc.submission.full_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID type</span>
                            <span className="font-medium capitalize">{kyc.submission.id_type?.replace("_", " ")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted</span>
                            <span className="font-medium">{new Date(kyc.submission.submitted_at).toLocaleDateString("en-KE")}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>

                  ) : (
                    <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className="glass rounded-xl p-6 space-y-6">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {kyc?.kyc_status === "rejected" ? "Resubmit KYC Documents" : "Submit KYC Documents"}
                      </h2>

                      {kyc?.kyc_status === "rejected" && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Your previous submission was rejected.</strong>
                            {kyc.submission?.admin_note && <p className="mt-0.5">Reason: {kyc.submission.admin_note}</p>}
                            <p className="mt-0.5">Please resubmit with clearer, valid documents.</p>
                          </div>
                        </div>
                      )}

                      {/* Identity Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                            Full Legal Name <span className="text-destructive">*</span>
                          </label>
                          <Input placeholder="As it appears on your ID" value={fullName}
                            onChange={e => setFullName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                            ID Type <span className="text-destructive">*</span>
                          </label>
                          <select value={idType} onChange={e => setIdType(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                            ID / Passport Number <span className="text-destructive">*</span>
                          </label>
                          <Input placeholder="Enter your ID or passport number" value={idNumber}
                            onChange={e => setIdNumber(e.target.value)} />
                        </div>
                      </div>

                      {/* Document Uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploader label="ID Front" required hint="Front side of your ID document · Max 5 MB"
                          preview={frontB64} onChange={setFrontB64} />
                        <ImageUploader label="ID Back" hint="Back side of your ID (not needed for passport)"
                          preview={backB64} onChange={setBackB64} />
                      </div>
                      <ImageUploader label="Selfie holding your ID (optional)"
                        hint="Take a photo of yourself holding your ID document · Max 5 MB"
                        preview={selfieB64} onChange={setSelfieB64} />

                      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
                        {submitting
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading documents…</>
                          : <><ShieldCheck className="w-4 h-4 mr-2" />Submit for Verification</>}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By submitting, you confirm these documents belong to you and the information is accurate.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}
        </div>
      </main>
          <MobileBottomNav />
    </div>
  );
}
