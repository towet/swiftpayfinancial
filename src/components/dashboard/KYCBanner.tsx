import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Clock, Zap, X, ChevronRight, FileText, Shield } from "lucide-react";
import axios from "axios";

interface KycStatus {
  kyc_status: "unverified" | "submitted" | "verified" | "rejected";
  kyc_deadline: string | null;
  is_verified: boolean;
  grace_active: boolean;
  submission?: {
    full_name: string;
    status: string;
    submitted_at: string;
    admin_note?: string;
  } | null;
}

function timeLeft(deadline: string | null): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export function KYCBanner() {
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchKyc = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/kyc/status");
      if (data.status === "success") setKyc(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchKyc();
    const id = window.setInterval(fetchKyc, 60_000);
    return () => window.clearInterval(id);
  }, [fetchKyc]);

  // Countdown tick every 30s
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("kyc-banner-dismissed") === "true") setDismissed(true);
  }, []);

  if (!kyc || kyc.is_verified) return null;

  const isExpired   = kyc.kyc_deadline ? new Date(kyc.kyc_deadline) <= new Date() : false;
  const isSubmitted = kyc.kyc_status === "submitted";
  const isRejected  = kyc.kyc_status === "rejected";
  const isCritical  = isExpired && !isSubmitted;

  // Don't show if grace period still active + not critical + dismissed
  if (!isCritical && !isRejected && !isSubmitted && dismissed) return null;

  const bgClass = isCritical || isRejected
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : isSubmitted
    ? "bg-primary/10 border-primary/30 text-primary"
    : "bg-warning/10 border-warning/30 text-warning";

  const icon = isCritical || isRejected
    ? <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 animate-pulse" />
    : isSubmitted
    ? <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
    : <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />;

  const headline = isCritical
    ? "⚠️ Your account is unverified — payments are paused"
    : isRejected
    ? "❌ Your KYC was rejected — please resubmit"
    : isSubmitted
    ? "🔍 KYC under review — we'll notify you within 24 hours"
    : `⏳ Verify your account — ${timeLeft(kyc.kyc_deadline)}`;

  const body = isCritical
    ? "Complete KYC (ID verification) to resume accepting payments. This is a one-time process to keep SwiftPay secure."
    : isRejected
    ? (kyc.submission?.admin_note ? `Reason: ${kyc.submission.admin_note}. ` : "") + "Please resubmit with clear, valid documents."
    : isSubmitted
    ? "Your documents have been submitted. No action needed. You can still accept payments during review."
    : "New accounts have 24 hours to complete verification. Payments are blocked once the grace period expires.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className={`border-b px-4 md:px-6 py-3 ${bgClass}`}
      >
        <div className="flex items-start justify-between gap-4 max-w-screen-xl mx-auto">
          <div className="flex items-start gap-3">
            {icon}
            <div>
              <p className="font-semibold text-sm">{headline}</p>
              <p className="text-xs mt-0.5 opacity-80">{body}</p>
              {!isSubmitted && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Link
                    to="/dashboard/kyc"
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105 ${
                      isCritical || isRejected
                        ? "bg-destructive text-white hover:bg-destructive/90"
                        : "bg-warning text-black hover:bg-warning/90"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    {isRejected ? "Resubmit KYC" : "Complete KYC Now"}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  {!isCritical && !isRejected && kyc.kyc_deadline && (
                    <span className="text-xs opacity-60 font-mono">{timeLeft(kyc.kyc_deadline)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {!isCritical && !isRejected && (
            <button
              onClick={() => { setDismissed(true); sessionStorage.setItem("kyc-banner-dismissed", "true"); }}
              className="p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
