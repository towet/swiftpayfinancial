import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Lock, Phone, Wallet } from "lucide-react";

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
    const phone_number = String(phone || "").trim();
    if (!phone_number || phone_number.length < 9) {
      toast({
        title: "Invalid phone",
        description: "Enter a valid phone number (e.g. 2547XXXXXXXX)",
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
    try {
      const res = await axios.post(`/api/payment-links/${id}/pay`, {
        phone_number,
        amount: isCustomAmount ? amt : undefined,
      });

      if (res.data?.status === "success") {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass rounded-2xl border border-border/50 p-6"
      >
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !link ? (
          <div className="text-center py-10">
            <div className="text-2xl font-bold text-foreground">Link not found</div>
            <div className="text-muted-foreground mt-2">This payment link may have been deleted.</div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Secure Payment Link
                </div>
                <h1 className="text-2xl font-bold text-foreground mt-2">{link.title}</h1>
                {link.description ? (
                  <p className="text-muted-foreground mt-2">{link.description}</p>
                ) : null}
              </div>
              <div className="p-3 rounded-xl gradient-safaricom">
                <Wallet className="h-6 w-6 text-safaricom-foreground" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl border border-border/50 p-4">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="text-xl font-bold text-foreground mt-1">
                  {Number(link.amount || 0) > 0 ? `KES ${Number(link.amount).toLocaleString()}` : "Enter amount"}
                </div>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-xl font-bold text-foreground mt-1 capitalize">{link.status}</div>
              </div>
            </div>

            {expired ? (
              <div className="mt-6 glass rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="text-foreground font-semibold">This link has expired.</div>
                <div className="text-muted-foreground text-sm mt-1">Ask the merchant to generate a new link.</div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Phone number</label>
                  <div className="mt-2 relative">
                    <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>

                {isCustomAmount ? (
                  <div>
                    <label className="text-sm text-muted-foreground">Amount (KES)</label>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="mt-2 bg-secondary border-border"
                      inputMode="decimal"
                    />
                  </div>
                ) : null}

                <Button className="w-full" variant="gradient" disabled={submitting} onClick={pay}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending STK...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  You will receive an M-Pesa prompt on your phone to complete payment.
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
