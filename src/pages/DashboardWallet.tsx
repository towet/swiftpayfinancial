import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { formatTimeInAppTz, normalizeKenyanPhoneNumber } from "@/lib/utils";

interface WalletInfo {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  entry_type: "credit" | "debit" | string;
  amount: number;
  currency: string;
  source: string;
  reference: string;
  phone_number?: string | null;
  mpesa_receipt_number?: string | null;
  checkout_request_id?: string | null;
  created_at: string;
}

interface WalletDeposit {
  id: string;
  wallet_id: string;
  amount: number;
  phone_number: string;
  status: "pending" | "success" | "failed" | string;
  mpesa_request_id?: string | null;
  checkout_request_id?: string | null;
  mpesa_response?: any;
  callback_data?: any;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

const depositStatusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  success: "bg-safaricom/20 text-safaricom border-safaricom/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const ledgerTypeStyles: Record<string, string> = {
  credit: "bg-safaricom/15 text-safaricom border-safaricom/30",
  debit: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function DashboardWallet() {
  const { toast } = useToast();

  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);

  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  const [amount, setAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [polling, setPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiBaseUrl =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    (import.meta.env?.MODE === "development"
      ? "http://localhost:5000"
      : "https://swiftpay-backend-uvv9.onrender.com");

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const fetchWallet = async () => {
    setLoadingWallet(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status === "success") {
        setWallet(response.data.wallet);
        setBalance(Number(response.data.balance || 0));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load wallet",
        variant: "destructive",
      });
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/wallet/ledger", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status === "success") {
        setLedger(response.data.ledger || []);
        setBalance(Number(response.data.balance || 0));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load ledger",
        variant: "destructive",
      });
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/wallet/deposits", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status === "success") {
        setDeposits(response.data.deposits || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load deposits",
        variant: "destructive",
      });
    } finally {
      setLoadingDeposits(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchWallet(), fetchLedger(), fetchDeposits()]);
  };

  const latestDeposit = useMemo(() => {
    if (!Array.isArray(deposits) || deposits.length === 0) return null;
    return deposits[0];
  }, [deposits]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPolling(false);
  };

  const startPolling = () => {
    stopPolling();
    setPolling(true);
    pollingIntervalRef.current = window.setInterval(async () => {
      await Promise.all([fetchDeposits(), fetchLedger(), fetchWallet()]);
    }, 5000);
  };

  useEffect(() => {
    refreshAll();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const status = String(latestDeposit?.status || "").toLowerCase();
    if (!latestDeposit) return;

    if (status === "pending" && !polling) {
      startPolling();
      return;
    }

    if (polling && status !== "pending") {
      stopPolling();
      refreshAll();
      if (status === "success") {
        toast({
          title: "Deposit confirmed",
          description: "Your wallet balance was updated successfully",
        });
      }
      if (status === "failed") {
        const resultDesc = latestDeposit?.callback_data?.Body?.stkCallback?.ResultDesc;
        toast({
          title: "Deposit failed",
          description: String(resultDesc || "The deposit did not complete"),
          variant: "destructive",
        });
      }
    }
  }, [latestDeposit?.id, latestDeposit?.status]);

  const submitDeposit = async () => {
    const parsedAmount = Number(String(amount).trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount > 70000) {
      toast({
        title: "Amount too high",
        description: "Maximum deposit is 70,000 KES",
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
        "/api/wallet/deposits/stk-push",
        { amount: parsedAmount, phone_number },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === "success") {
        toast({
          title: "STK sent",
          description: "Check your phone and enter your M-Pesa PIN",
        });
        setAmount("");
        setPhoneNumber("");
        await fetchDeposits();
      } else {
        toast({
          title: "Deposit failed",
          description: res.data?.message || "Failed to start deposit",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Deposit failed",
        description: error?.response?.data?.message || "Failed to start deposit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const manualReconcile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/wallet/deposits/reconcile",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === "success") {
        await fetchDeposits();
        toast({
          title: "Reconciled",
          description: `Updated ${Number(res.data.updated || 0)} pending deposit(s)`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Reconcile failed",
        description: error?.response?.data?.message || "Failed to reconcile deposits",
        variant: "destructive",
      });
    }
  };

  const totals = useMemo(() => {
    const sum = (items: Array<{ amount: number }>) => items.reduce((acc, x) => acc + Number(x.amount || 0), 0);
    return {
      depositsCount: deposits.length,
      depositsAmount: sum(deposits),
      ledgerCount: ledger.length,
      ledgerNet: ledger.reduce((acc, x) => {
        const amt = Number(x.amount || 0);
        const t = String(x.entry_type || "").toLowerCase();
        if (t === "credit") return acc + amt;
        if (t === "debit") return acc - amt;
        return acc;
      }, 0),
    };
  }, [deposits, ledger]);

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200);
      toast({ title: "Copied", description: "Copied to clipboard" });
    } catch (error) {
      toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader title="Wallet" breadcrumbs={["Dashboard", "Wallet"]} />

        <div className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Balance</h2>
                <p className="text-sm text-muted-foreground mt-1">Your current wallet balance</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={refreshAll} disabled={loadingWallet || loadingLedger || loadingDeposits}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-3xl font-bold text-foreground">{loadingWallet ? "..." : formatAmount(balance)}</div>
                <div className="text-xs text-muted-foreground mt-1">Wallet ID: <span className="font-mono">{wallet?.id || "—"}</span></div>
              </div>
              <div className="flex items-center gap-2">
                {polling ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-warning/20 text-warning border-warning/30">
                    Polling deposits...
                  </span>
                ) : null}
                {latestDeposit ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${depositStatusStyles[String(latestDeposit.status || "").toLowerCase()] || "bg-secondary/40 text-muted-foreground border-border"}`}>
                    Latest: {latestDeposit.status}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No deposits yet</span>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Merchant Integration (API Key)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use this to trigger STK deposits into your wallet from your website/app.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Keep your API key secret. Call this endpoint from your server/backend, not directly from browser JavaScript.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard/api-keys")}>
                  Manage API Keys
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="glass rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Endpoint</div>
                    <div className="text-xs text-muted-foreground mt-1">POST</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard("endpoint", `${apiBaseUrl}/api/wallet/deposits/stk-push-api`)}
                  >
                    {copiedKey === "endpoint" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy
                  </Button>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-secondary/50 border border-border p-3 text-xs text-foreground font-mono">
{`${apiBaseUrl}/api/wallet/deposits/stk-push-api`}
                </pre>
                <div className="mt-2 text-xs text-muted-foreground">
                  Auth header format required by SwiftPay: <span className="font-mono text-foreground">Authorization: Bearer &lt;API_KEY&gt;</span>
                </div>
              </div>

              <div className="glass rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-semibold text-foreground">Example (curl)</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        "curl",
                        `curl -X POST "${apiBaseUrl}/api/wallet/deposits/stk-push-api" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{"phone_number":"2547XXXXXXXX","amount":10,"reference":"ORDER-123","description":"Wallet top up"}'`
                      )
                    }
                  >
                    {copiedKey === "curl" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy
                  </Button>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-secondary/50 border border-border p-3 text-xs text-foreground font-mono">
{`curl -X POST "${apiBaseUrl}/api/wallet/deposits/stk-push-api" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"phone_number":"2547XXXXXXXX","amount":10,"reference":"ORDER-123","description":"Wallet top up"}'`}
                </pre>
              </div>

              <div className="glass rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-semibold text-foreground">Example (fetch)</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        "fetch",
                        `await fetch("${apiBaseUrl}/api/wallet/deposits/stk-push-api", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    phone_number: "2547XXXXXXXX",
    amount: 10,
    reference: "ORDER-123",
    description: "Wallet top up",
  }),
});`
                      )
                    }
                  >
                    {copiedKey === "fetch" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy
                  </Button>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-secondary/50 border border-border p-3 text-xs text-foreground font-mono">
{`await fetch("${apiBaseUrl}/api/wallet/deposits/stk-push-api", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    phone_number: "2547XXXXXXXX",
    amount: 10,
    reference: "ORDER-123",
    description: "Wallet top up",
  }),
});`}
                </pre>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Deposit via M-Pesa (STK)</h2>
                <p className="text-sm text-muted-foreground mt-1">Max deposit: 70,000 KES</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={manualReconcile} disabled={loadingDeposits}>
                  Reconcile
                </Button>
                {polling ? (
                  <Button variant="outline" onClick={stopPolling}>
                    Stop polling
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="text-sm text-muted-foreground">Amount (KES)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10"
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
                <Button variant="gradient" className="w-full" disabled={submitting} onClick={submitDeposit}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send STK Prompt"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Deposit history</h3>
                <p className="text-sm text-muted-foreground mt-1">{totals.depositsCount} deposit(s) — {formatAmount(totals.depositsAmount)}</p>
              </div>
            </div>

            {loadingDeposits ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : deposits.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No deposits yet</p>
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
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => {
                      const style = depositStatusStyles[String(d.status || "").toLowerCase()] || "bg-secondary/40 text-muted-foreground border-border";
                      const resultDesc = d?.callback_data?.Body?.stkCallback?.ResultDesc;
                      const receipt = d?.callback_data?.Body?.stkCallback?.CallbackMetadata?.Item?.find?.((x: any) => x?.Name === "MpesaReceiptNumber")?.Value;
                      return (
                        <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-foreground">{formatAmount(Number(d.amount || 0))}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground font-mono text-sm">{d.phone_number}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">{formatTimeInAppTz(d.created_at)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                              {receipt ? <div>Receipt: <span className="font-mono">{String(receipt)}</span></div> : null}
                              {resultDesc ? <div>{String(resultDesc)}</div> : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ledger</h3>
                <p className="text-sm text-muted-foreground mt-1">{totals.ledgerCount} entry(s) — Net {formatAmount(totals.ledgerNet)}</p>
              </div>
            </div>

            {loadingLedger ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ledger.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No ledger entries yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Type</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Amount</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Source</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Phone</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Receipt</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((l) => {
                      const t = String(l.entry_type || "").toLowerCase();
                      const style = ledgerTypeStyles[t] || "bg-secondary/40 text-muted-foreground border-border";
                      return (
                        <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
                              {l.entry_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-foreground">{formatAmount(Number(l.amount || 0))}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">{l.source}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground font-mono text-sm">{l.phone_number || "—"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground font-mono text-sm">{l.mpesa_receipt_number || "—"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">{formatTimeInAppTz(l.created_at)}</span>
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
