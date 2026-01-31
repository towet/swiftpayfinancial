import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { normalizeKenyanPhoneNumber } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, Loader2, Lock, Phone, ShieldCheck, Sparkles, Wallet } from "lucide-react";

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  description: string;
  status: string;
  link: string;
  expires_at: string | null;
  require_contact?: boolean;
  require_email?: boolean;
}

export default function Pay() {
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [stkSent, setStkSent] = useState(false);

  const isCustomAmount = useMemo(() => {
    const fixed = Number(link?.amount || 0);
    return fixed <= 0;
  }, [link?.amount]);

  useEffect(() => {
    const fetchLink = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/payment-links/${id}`);
        if (res.data?.status === "success") {
          setLink(res.data.link);
          const fixed = Number(res.data.link?.amount || 0);
          setAmount(fixed > 0 ? String(fixed) : "");

          try {
            await axios.post(`/api/payment-links/${id}/click`);
          } catch (e) {
          }
        } else {
          setLink(null);
        }
      } catch (error: any) {
        setLink(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLink();
  }, [id]);

  const pay = async () => {
    const phone_number = normalizeKenyanPhoneNumber(phone);
    if (!phone_number) {
      toast({
        title: "Invalid phone",
        description: "Enter a valid phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX)",
        variant: "destructive",
      });
      return;
    }

    const amt = Number(String(amount || "").trim());
    if (isCustomAmount) {
      if (!Number.isFinite(amt) || amt <= 0) {
        toast({
          title: "Invalid amount",
          description: "Enter a valid amount",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    setStkSent(false);
    try {
      const res = await axios.post(`/api/payment-links/${id}/pay`, {
        phone_number,
        amount: isCustomAmount ? amt : undefined,
      });

      if (res.data?.status === "success") {
        setStkSent(true);
        toast({
          title: "STK prompt sent",
          description: "Check your phone and enter your M-Pesa PIN",
        });
      } else {
        toast({
          title: "Payment failed",
          description: res.data?.message || "Failed to start payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error?.response?.data?.message || "Failed to start payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const status = String(link?.status || "").toLowerCase();
  const expired = status === "expired";
  const completed = status === "completed";
  const fixedAmount = Number(link?.amount || 0);
  const displayAmount = useMemo(() => {
    if (!link) return "";
    if (fixedAmount > 0) return `KES ${fixedAmount.toLocaleString()}`;
    const amt = Number(String(amount || "").trim());
    if (Number.isFinite(amt) && amt > 0) return `KES ${amt.toLocaleString()}`;
    return "KES —";
  }, [amount, fixedAmount, link]);

  const step: "details" | "sending" | "sent" = useMemo(() => {
    if (submitting) return "sending";
    if (stkSent) return "sent";
    return "details";
  }, [stkSent, submitting]);

  const stepIndex = step === "details" ? 0 : step === "sending" ? 1 : 2;

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-safaricom/10 blur-3xl" />
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="hidden lg:block">
                <div className="glass-strong rounded-3xl border border-border/50 p-8">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    SwiftPay Payment Link
                  </div>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight">
                    <span className="text-primary">Pay in seconds.</span>
                    <span className="text-foreground"> Securely.</span>
                  </div>
                  <div className="mt-4 text-muted-foreground leading-relaxed">
                    Open the link, confirm the amount, enter your number, and complete via an M-Pesa STK prompt.
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div className="glass rounded-2xl border border-border/50 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center glow-sm">
                        <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">SwiftPay Protected</div>
                        <div className="text-xs text-muted-foreground">Encrypted checkout + secure callbacks</div>
                      </div>
                    </div>
                    <div className="glass rounded-2xl border border-border/50 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-safaricom flex items-center justify-center glow-safaricom">
                        <Wallet className="h-5 w-5 text-safaricom-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">M-Pesa STK Prompt</div>
                        <div className="text-xs text-muted-foreground">Pay with your PIN on your phone</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative group">
                  <div className="relative w-[340px] sm:w-[360px] h-[720px] bg-[#0a0a0a] rounded-[3.5rem] border-[12px] border-[#1a1a1a] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="absolute top-0 w-full h-7 bg-[#1a1a1a] flex justify-center z-50">
                      <div className="w-24 h-5 bg-black rounded-b-2xl flex items-center justify-center gap-1.5">
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <div className="w-8 h-1 bg-white/20 rounded-full" />
                      </div>
                    </div>

                    <div className="h-full bg-white overflow-y-auto scrollbar-hide pt-10 pb-28">
                      {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 px-8">
                          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <div className="text-sm font-semibold text-gray-700">Opening checkout…</div>
                          <div className="text-xs text-gray-500">Securely loading payment details</div>
                        </div>
                      ) : !link ? (
                        <div className="h-full flex items-center justify-center p-6">
                          <div className="w-full max-w-sm space-y-4 text-center">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full mx-auto flex items-center justify-center">
                              <Wallet className="h-8 w-8 text-rose-500" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">Link not found</div>
                            <div className="text-sm text-gray-500">This payment link may have been deleted.</div>
                            <Button variant="outline" className="rounded-full" onClick={() => (window.location.href = "/") }>
                              Back to SwiftPay
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                            <div className="h-16 px-4 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <ChevronLeft className="h-5 w-5 text-gray-800" />
                              </button>
                              <div className="min-w-0 px-3 text-center">
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-indigo-600 inline-flex items-center justify-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  SwiftPay Checkout
                                </div>
                                <div className="text-sm font-black text-gray-900 truncate">{link.title}</div>
                              </div>
                              <div className="w-10" />
                            </div>
                          </header>

                          <main className="px-4">
                            <div className="pt-6 pb-4 text-center space-y-3">
                              <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-gray-500">
                                <Lock className="h-4 w-4" />
                                Secure payment link
                              </div>
                              <div className="text-[34px] leading-none font-black tracking-tight text-indigo-700 drop-shadow-sm tabular-nums">{displayAmount}</div>
                              {link.description ? (
                                <div className="text-sm text-gray-500 leading-relaxed">{link.description}</div>
                              ) : null}
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <Badge
                                  variant={expired ? "destructive" : completed ? "secondary" : "outline"}
                                  className="bg-white text-gray-800 border-gray-200 shadow-sm inline-flex items-center gap-1"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {expired ? "Expired" : completed ? "Completed" : "Active"}
                                </Badge>
                                <Badge variant="outline" className="bg-white text-gray-800 border-gray-200 shadow-sm inline-flex items-center gap-1">
                                  <Wallet className="h-3.5 w-3.5" />
                                  M-Pesa STK
                                </Badge>
                              </div>
                            </div>

                            {expired ? (
                              <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100 space-y-1">
                                <div className="text-sm font-black text-rose-700">This link has expired.</div>
                                <div className="text-xs text-rose-600">Ask the merchant to generate a new link.</div>
                              </div>
                            ) : (
                              <div className="space-y-4 pb-10">
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-gray-500 inline-flex items-center gap-2">
                                      <Wallet className="h-4 w-4 text-emerald-600" />
                                      Pay with M-Pesa
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        {[0, 1, 2].map((i) => (
                                          <span
                                            key={i}
                                            className={`h-1.5 w-1.5 rounded-full ${i <= stepIndex ? "bg-indigo-600" : "bg-gray-200"}`}
                                          />
                                        ))}
                                      </div>
                                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Step {step === "details" ? 1 : step === "sending" ? 2 : 3} / 3
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 space-y-4">
                                    <div>
                                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 inline-flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone number
                                      </div>
                                      <div className="mt-2 relative">
                                        <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                          value={phone}
                                          onChange={(e) => setPhone(e.target.value)}
                                          placeholder="07XXXXXXXX"
                                          className="pl-9 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl h-12 focus-visible:ring-indigo-500"
                                          inputMode="tel"
                                        />
                                      </div>
                                      <div className="mt-2 text-[11px] text-gray-500 inline-flex items-center gap-2">
                                        <Lock className="h-3.5 w-3.5" />
                                        Use format: 07XXXXXXXX or 2547XXXXXXXX
                                      </div>
                                    </div>

                                    {isCustomAmount ? (
                                      <div>
                                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 inline-flex items-center gap-2">
                                          <Wallet className="h-3.5 w-3.5" />
                                          Amount (KES)
                                        </div>
                                        <Input
                                          value={amount}
                                          onChange={(e) => setAmount(e.target.value)}
                                          placeholder="e.g. 500"
                                          className="mt-2 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl h-12 focus-visible:ring-indigo-500"
                                          inputMode="decimal"
                                        />
                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                          {[200, 500, 1000, 2000].map((v) => (
                                            <button
                                              type="button"
                                              key={v}
                                              onClick={() => setAmount(String(v))}
                                              className="h-10 rounded-xl bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-xs font-black text-gray-900 transition-colors"
                                            >
                                              {v}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}

                                    <Button
                                      className="w-full h-12 rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] transition-transform bg-indigo-600 hover:bg-indigo-700"
                                      variant="default"
                                      disabled={submitting}
                                      onClick={pay}
                                    >
                                      {submitting ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Sending STK…
                                        </>
                                      ) : stkSent ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          STK Sent
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Pay Now
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </motion.div>

                                {stkSent ? (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100"
                                  >
                                    <div className="text-sm font-black text-emerald-700">Prompt sent to your phone.</div>
                                    <div className="text-xs text-emerald-700/80 mt-1">
                                      Open the STK prompt, confirm <span className="font-black">{displayAmount}</span>, then enter your M-Pesa PIN.
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={pay}
                                        disabled={submitting}
                                      >
                                        Send again
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-full text-emerald-700 hover:bg-emerald-100"
                                        onClick={() => setStkSent(false)}
                                        disabled={submitting}
                                      >
                                        Edit details
                                      </Button>
                                    </div>
                                  </motion.div>
                                ) : null}
                              </div>
                            )}
                          </main>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-indigo-600/10 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">SwiftPay Protected</div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase">Secure M-Pesa Checkout</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</div>
                          <div className="text-lg font-black text-gray-900 leading-none">{displayAmount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
