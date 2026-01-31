import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { formatTimeInAppTz, normalizeKenyanPhoneNumber } from "@/lib/utils";

interface WalletWithdrawalRequest {
  id: string;
  amount: number;
  phone_number: string;
  status: "pending" | "approved" | "rejected" | "paid" | string;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  paid: "bg-safaricom/20 text-safaricom border-safaricom/30",
};

export default function DashboardWithdrawals() {
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [withdrawals, setWithdrawals] = useState<WalletWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/wallet/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.status === "success") {
        setWithdrawals(response.data.withdrawals || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchWithdrawals();
    };
    window.addEventListener('swiftpay:data-refresh', handler as any);
    const channel = new BroadcastChannel('swiftpay-refresh');
    channel.onmessage = () => {
      fetchWithdrawals();
    };
    return () => {
      window.removeEventListener('swiftpay:data-refresh', handler as any);
      channel.close();
    };
  }, []);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totals = useMemo(() => {
    const sum = (items: WalletWithdrawalRequest[]) =>
      items.reduce((acc, x) => acc + Number(x.amount || 0), 0);

    return {
      count: withdrawals.length,
      amount: sum(withdrawals),
    };
  }, [withdrawals]);

  const submitWithdrawalRequest = async () => {
    const parsedAmount = Number(String(amount).trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount > 70000) {
      toast({
        title: "Amount too high",
        description: "Maximum withdrawal is 70,000 KES",
        variant: "destructive",
      });
      return;
    }

    const phone_number = normalizeKenyanPhoneNumber(phoneNumber);
    if (!phone_number) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX)",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/wallet/withdrawals",
        { amount: parsedAmount, phone_number },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === "success") {
        toast({
          title: "Withdrawal requested",
          description: "Your request was submitted and is pending review",
        });
        setAmount("");
        setPhoneNumber("");
        fetchWithdrawals();
        try {
          window.dispatchEvent(new Event('swiftpay:data-refresh'));
          const channel = new BroadcastChannel('swiftpay-refresh');
          channel.postMessage({ type: 'data-refresh' });
          channel.close();
        } catch (e) {
        }
      } else {
        toast({
          title: "Request failed",
          description: res.data?.message || "Failed to create withdrawal request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error?.response?.data?.message || "Failed to create withdrawal request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader title="Withdrawals" breadcrumbs={["Dashboard", "Withdrawals"]} />

        <div className="p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Request a withdrawal</h2>
                <p className="text-sm text-muted-foreground mt-1">Max withdrawal: 70,000 KES. Requests are reviewed by a Super Admin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="text-sm text-muted-foreground">Amount (KES)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="mt-2 bg-secondary border-border"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone number</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 07XXXXXXXX"
                  className="mt-2 bg-secondary border-border"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="gradient"
                  className="w-full"
                  disabled={submitting}
                  onClick={submitWithdrawalRequest}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Withdrawal history</h3>
                <p className="text-sm text-muted-foreground mt-1">{totals.count} request(s) — {formatAmount(totals.amount)}</p>
              </div>
              <Button variant="outline" onClick={fetchWithdrawals} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Amount</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Phone</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Time</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => {
                      const style = statusStyles[String(w.status || "").toLowerCase()] || "bg-secondary/40 text-muted-foreground border-border";
                      return (
                        <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-foreground">{formatAmount(Number(w.amount || 0))}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground font-mono text-sm">{w.phone_number}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">{formatTimeInAppTz(w.created_at)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">{w.admin_notes || "—"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
