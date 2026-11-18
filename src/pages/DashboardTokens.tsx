import { useEffect, useRef, useState, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KYCBanner } from "@/components/dashboard/KYCBanner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Wallet,
  TrendingUp,
  Receipt,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { normalizeKenyanPhoneNumber } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenAccount {
  id: string;
  user_id: string;
  balance: number;
  total_topped_up: number;
  total_fees_charged: number;
  created_at: string;
  updated_at: string;
}

interface LedgerEntry {
  id: string;
  user_id: string;
  entry_type: "credit" | "debit";
  amount: number;
  balance_after: number;
  source: string;
  reference?: string | null;
  description?: string | null;
  transaction_amount?: number | null;
  created_at: string;
}

interface TopupRequest {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  status: "pending" | "success" | "failed";
  mpesa_receipt_number?: string | null;
  completed_at?: string | null;
  created_at: string;
}

interface FeeScheduleTier {
  min: number;
  max: number;
  fee: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ledgerTypeStyles: Record<string, string> = {
  credit: "bg-safaricom/15 text-safaricom border-safaricom/30",
  debit: "bg-destructive/15 text-destructive border-destructive/30",
};

const topupStatusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  success: "bg-safaricom/20 text-safaricom border-safaricom/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const topupStatusIcons: Record<string, JSX.Element> = {
  pending: <Clock className="w-3 h-3" />,
  success: <CheckCircle2 className="w-3 h-3" />,
  failed: <XCircle className="w-3 h-3" />,
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 20;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardTokens() {
  const { toast } = useToast();

  // Account state
  const [account, setAccount] = useState<TokenAccount | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleTier[]>([]);

  // Loading states
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [loadingTopups, setLoadingTopups] = useState(true);

  // Top-up form
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Polling
  const [polling, setPolling] = useState(false);
  const [pendingTopupId, setPendingTopupId] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef(0);

  // Fee calculator
  const [calcAmount, setCalcAmount] = useState("");
  const [calcFee, setCalcFee] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // UI toggles
  const [showSchedule, setShowSchedule] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const LEDGER_PAGE_SIZE = 10;

  // ── Data fetchers ────────────────────────────────────────────────────────

  const fetchAccount = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/tokens");
      if (data.status === "success") setAccount(data.account);
    } catch {
      /* silent */
    } finally {
      setLoadingAccount(false);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/tokens/ledger?limit=100");
      if (data.status === "success") setLedger(data.ledger ?? []);
    } catch {
      /* silent */
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  const fetchTopups = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/tokens/topups?limit=50");
      if (data.status === "success") setTopups(data.topups ?? []);
    } catch {
      /* silent */
    } finally {
      setLoadingTopups(false);
    }
  }, []);

  const fetchFeeSchedule = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/tokens/fee-schedule");
      if (data.status === "success") setFeeSchedule(data.schedule ?? []);
    } catch {
      /* silent */
    }
  }, []);

  const refreshAll = useCallback(() => {
    setLoadingAccount(true);
    setLoadingLedger(true);
    setLoadingTopups(true);
    fetchAccount();
    fetchLedger();
    fetchTopups();
  }, [fetchAccount, fetchLedger, fetchTopups]);

  useEffect(() => {
    fetchAccount();
    fetchLedger();
    fetchTopups();
    fetchFeeSchedule();
  }, [fetchAccount, fetchLedger, fetchTopups, fetchFeeSchedule]);

  // ── Polling logic ────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setPolling(false);
    pollAttemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (topupId: string) => {
      setPendingTopupId(topupId);
      setPolling(true);
      pollAttemptsRef.current = 0;

      pollingRef.current = window.setInterval(async () => {
        pollAttemptsRef.current += 1;
        if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
          stopPolling();
          toast({ title: "Top-up timed out", description: "Please check your M-Pesa for confirmation.", variant: "destructive" });
          return;
        }

        try {
          const { data } = await axios.get(`/api/tokens/topup/${topupId}/status`);
          if (data.topup?.status === "success") {
            stopPolling();
            setPendingTopupId(null);
            toast({ title: "✅ Top-up successful!", description: `KES ${data.topup.amount} tokens added to your balance.` });
            refreshAll();
          } else if (data.topup?.status === "failed") {
            stopPolling();
            setPendingTopupId(null);
            toast({ title: "Top-up failed", description: "M-Pesa payment was not completed.", variant: "destructive" });
            refreshAll();
          }
        } catch {
          /* ignore transient errors */
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, toast, refreshAll]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Top-up handler ───────────────────────────────────────────────────────

  const handleTopup = async () => {
    const amt = Number(amount);
    if (!amt || amt < 10) {
      toast({ title: "Invalid amount", description: "Minimum top-up is KES 10.", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: "Phone required", description: "Enter your M-Pesa phone number.", variant: "destructive" });
      return;
    }

    const normalizedPhone = normalizeKenyanPhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      toast({ title: "Invalid phone", description: "Enter a valid Kenyan phone number (07xxxxxxxx).", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/tokens/topup", {
        amount: amt,
        phone_number: normalizedPhone,
      });

      if (data.status === "success" && data.topup_id) {
        toast({ title: "STK Push sent! 📲", description: "Enter your M-Pesa PIN to complete the top-up." });
        setAmount("");
        startPolling(data.topup_id);
      } else {
        toast({ title: "Failed to initiate", description: data.message || "Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to initiate top-up.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Fee calculator ────────────────────────────────────────────────────────

  const calculateFee = useCallback(async (val: string) => {
    const amt = Number(val);
    if (!amt || amt <= 0) { setCalcFee(null); return; }
    setCalcLoading(true);
    try {
      const { data } = await axios.post("/api/tokens/calculate-fee", { amount: amt });
      if (data.status === "success") setCalcFee(data.fee);
    } catch { setCalcFee(null); }
    finally { setCalcLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => calculateFee(calcAmount), 400);
    return () => clearTimeout(timer);
  }, [calcAmount, calculateFee]);

  // ── Ledger pagination ─────────────────────────────────────────────────────

  const totalLedgerPages = Math.max(1, Math.ceil(ledger.length / LEDGER_PAGE_SIZE));
  const paginatedLedger = ledger.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const todayFees = ledger
    .filter((e) => e.entry_type === "debit" && e.source === "platform_fee" &&
      new Date(e.created_at).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + Number(e.amount), 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <KYCBanner />

        <div className="p-4 md:p-6 lg:p-8 space-y-8">

          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Zap className="w-7 h-7 text-warning" />
                  Tokens & Credits
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Prepaid platform credits — top up once, transact freely. Fees are auto-deducted per transaction.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshAll} disabled={loadingAccount}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingAccount ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* ── Stat Cards ── */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              {
                label: "Token Balance",
                value: loadingAccount ? "—" : `KES ${fmt(account?.balance ?? 0)}`,
                icon: <Zap className="w-5 h-5 text-warning" />,
                color: "text-warning",
                bg: "from-warning/10 to-transparent",
                sub: "Available credits",
              },
              {
                label: "Total Topped Up",
                value: loadingAccount ? "—" : `KES ${fmt(account?.total_topped_up ?? 0)}`,
                icon: <ArrowUpCircle className="w-5 h-5 text-safaricom" />,
                color: "text-safaricom",
                bg: "from-safaricom/10 to-transparent",
                sub: "All time",
              },
              {
                label: "Total Fees Paid",
                value: loadingAccount ? "—" : `KES ${fmt(account?.total_fees_charged ?? 0)}`,
                icon: <Receipt className="w-5 h-5 text-primary" />,
                color: "text-primary",
                bg: "from-primary/10 to-transparent",
                sub: "All time",
              },
              {
                label: "Today's Fees",
                value: loadingLedger ? "—" : `KES ${fmt(todayFees)}`,
                icon: <TrendingUp className="w-5 h-5 text-destructive" />,
                color: "text-destructive",
                bg: "from-destructive/10 to-transparent",
                sub: "Today",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i + 0.2 }}
                className={`glass rounded-xl p-5 bg-gradient-to-br ${card.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/40">{card.icon}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left col: Top-up + Fee Calculator */}
            <div className="space-y-6">

              {/* Top-Up Card */}
              <motion.div
                className="glass rounded-xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                  Top Up via M-Pesa
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Amount (KES)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={submitting || polling}
                      min={10}
                    />
                    {amount && Number(amount) >= 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Platform fee for a KES {amount} transaction:{" "}
                        <span className="text-warning font-semibold">
                          {feeSchedule.find(t => Number(amount) >= t.min && Number(amount) <= t.max)
                            ? `KES ${feeSchedule.find(t => Number(amount) >= t.min && Number(amount) <= t.max)?.fee}`
                            : "—"}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">M-Pesa Phone</label>
                    <Input
                      type="tel"
                      placeholder="07xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={submitting || polling}
                    />
                  </div>

                  <Button
                    className="w-full"
                    variant="glow"
                    onClick={handleTopup}
                    disabled={submitting || polling}
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending STK Push…</>
                    ) : polling ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Waiting for M-Pesa…</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> Top Up Tokens</>
                    )}
                  </Button>

                  <AnimatePresence>
                    {polling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning flex items-start gap-2"
                      >
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          An STK push has been sent to your phone. Enter your M-Pesa PIN to complete the top-up.
                          Please don&apos;t close this page.
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                    <span>
                      Token balance is used to pay platform fees on every successful transaction.
                      Your customers pay the full amount — fees come from your balance.
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Fee Calculator */}
              <motion.div
                className="glass rounded-xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-primary" />
                  Fee Calculator
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Transaction Amount (KES)</label>
                    <Input
                      type="number"
                      placeholder="Enter any amount…"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      min={1}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {calcAmount && Number(calcAmount) > 0 && (
                      <motion.div
                        key={calcFee}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-lg bg-safaricom/10 border border-safaricom/30 p-4"
                      >
                        {calcLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Calculating…</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Transaction Amount</span>
                              <span className="font-medium">KES {fmt(Number(calcAmount))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Platform Fee</span>
                              <span className="font-bold text-warning">
                                {calcFee === 0 ? "FREE" : `KES ${fmt(calcFee ?? 0)}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-safaricom/20 pt-1 mt-1">
                              <span className="text-muted-foreground">Customer Pays</span>
                              <span className="font-bold text-safaricom">KES {fmt(Number(calcAmount))}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Fee Schedule Toggle */}
              <motion.div
                className="glass rounded-xl overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  onClick={() => setShowSchedule((s) => !s)}
                >
                  <span className="font-semibold flex items-center gap-2 text-sm">
                    <Receipt className="w-4 h-4 text-primary" />
                    Platform Fee Schedule
                  </span>
                  {showSchedule ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {showSchedule && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 max-h-80 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left pb-2 text-muted-foreground font-medium">Amount (KES)</th>
                              <th className="text-right pb-2 text-muted-foreground font-medium">Fee (KES)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feeSchedule.map((tier, i) => (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-1.5">
                                  {tier.max === Infinity
                                    ? `${fmt(tier.min)}+`
                                    : `${fmt(tier.min)} – ${fmt(tier.max)}`}
                                </td>
                                <td className="py-1.5 text-right font-semibold text-warning">
                                  {tier.fee === 0 ? <span className="text-safaricom">Free</span> : fmt(tier.fee)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right col: Ledger + Top-up History */}
            <div className="lg:col-span-2 space-y-6">

              {/* Token Ledger */}
              <motion.div
                className="glass rounded-xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-primary" />
                    Credit / Debit Ledger
                  </h2>
                  {loadingLedger && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {!loadingLedger && ledger.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No ledger entries yet. Top up tokens to get started.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</th>
                            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Type</th>
                            <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Amount</th>
                            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden md:table-cell">Description</th>
                            <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Balance After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedLedger.map((entry) => (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                {fmtDate(entry.created_at)}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${ledgerTypeStyles[entry.entry_type] ?? ""}`}>
                                  {entry.entry_type === "credit" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                                  {entry.entry_type}
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold">
                                <span className={entry.entry_type === "credit" ? "text-safaricom" : "text-destructive"}>
                                  {entry.entry_type === "credit" ? "+" : "-"}KES {fmt(entry.amount)}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                                {entry.description || entry.source || "—"}
                              </td>
                              <td className="p-3 text-right font-mono text-sm">
                                KES {fmt(entry.balance_after)}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalLedgerPages > 1 && (
                      <div className="flex items-center justify-between mt-4 text-sm">
                        <span className="text-muted-foreground">
                          Page {ledgerPage} of {totalLedgerPages}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={ledgerPage <= 1} onClick={() => setLedgerPage((p) => p - 1)}>
                            Prev
                          </Button>
                          <Button size="sm" variant="outline" disabled={ledgerPage >= totalLedgerPages} onClick={() => setLedgerPage((p) => p + 1)}>
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>

              {/* Top-up History */}
              <motion.div
                className="glass rounded-xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-safaricom" />
                    Top-Up History
                  </h2>
                  {loadingTopups && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {!loadingTopups && topups.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No top-ups yet. Make your first top-up above.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</th>
                          <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Amount</th>
                          <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Phone</th>
                          <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden md:table-cell">M-Pesa Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topups.map((t) => (
                          <motion.tr
                            key={t.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                              {fmtDate(t.created_at)}
                            </td>
                            <td className="p-3 text-right font-semibold text-safaricom">
                              KES {fmt(t.amount)}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                              {t.phone_number}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${topupStatusStyles[t.status] ?? ""}`}>
                                {topupStatusIcons[t.status]}
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs font-mono text-muted-foreground hidden md:table-cell">
                              {t.mpesa_receipt_number || "—"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
