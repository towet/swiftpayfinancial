import { useState, useEffect } from "react";
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TokenWarningBanner } from "@/components/dashboard/TokenWarningBanner";
import { KYCBanner } from "@/components/dashboard/KYCBanner";
import { StatCard } from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DollarSign, Receipt, CreditCard, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [stats, setStats] = useState([
    {
      title: "Total Revenue",
      value: 0,
      icon: DollarSign,
      trend: { value: 0, isPositive: true },
      prefix: "KES ",
    },
    {
      title: "Transactions Today",
      value: 0,
      icon: Receipt,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Active Tills",
      value: 0,
      icon: CreditCard,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Success Rate",
      value: 0,
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
      suffix: "%",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletReserved, setWalletReserved] = useState(0);
  const [walletAvailable, setWalletAvailable] = useState(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenLoading, setTokenLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchDashboardStats();
    };
    window.addEventListener('swiftpay:data-refresh', handler as any);
    const channel = new BroadcastChannel('swiftpay-refresh');
    channel.onmessage = () => {
      fetchDashboardStats();
    };
    return () => {
      window.removeEventListener('swiftpay:data-refresh', handler as any);
      channel.close();
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");

      setTokenLoading(true);
      const [statsResponse, tillsResponse, walletResponse, tokenResponse] = await Promise.all([
        axios.get("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/tills", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/tokens", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { account: { balance: 0 } } })),
      ]);
      setTokenBalance(Number(tokenResponse?.data?.account?.balance || 0));
      setTokenLoading(false);

      const dashStats = statsResponse.data.stats;

      // Calculate success rate
      const totalTransactions = dashStats.totalTransactions || 0;
      const successfulTransactions = dashStats.successfulTransactions || 0;
      const successRate = totalTransactions > 0 
        ? ((successfulTransactions / totalTransactions) * 100).toFixed(1)
        : 0;

      const activeTills = tillsResponse.data.tills?.length || 0;

      const wBalance = Number(walletResponse?.data?.balance || 0);
      const wReserved = Number(walletResponse?.data?.reserved || 0);
      const wAvailable = Number(
        walletResponse?.data?.available_balance !== undefined
          ? walletResponse.data.available_balance
          : wBalance - wReserved
      );
      setWalletBalance(wBalance);
      setWalletReserved(wReserved);
      setWalletAvailable(wAvailable);

      // Update stats
      const trends = dashStats.trends || {};
      setStats([
        {
          title: "Total Revenue",
          value: dashStats.totalAmount || 0,
          icon: DollarSign,
          trend: { value: Math.abs(trends.revenue?.pct ?? 0), isPositive: trends.revenue?.isPositive ?? true },
          prefix: "KES ",
        },
        {
          title: "Total Transactions",
          value: totalTransactions,
          icon: Receipt,
          trend: { value: Math.abs(trends.transactions?.pct ?? 0), isPositive: trends.transactions?.isPositive ?? true },
        },
        {
          title: "Active Tills",
          value: activeTills,
          icon: CreditCard,
          trend: { value: 0, isPositive: true },
        },
        {
          title: "Success Rate",
          value: parseFloat(successRate as string),
          icon: TrendingUp,
          trend: { value: Math.abs(trends.successRate?.pct ?? 0), isPositive: trends.successRate?.isPositive ?? true },
          suffix: "%",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-0 md:ml-0 md:ml-20 lg:ml-64 pb-20 md:pb-0 transition-all duration-300 pb-20 md:pb-0">
        <DashboardHeader title="Dashboard" breadcrumbs={["Home", "Overview"]} />
        <KYCBanner />
        <TokenWarningBanner />

        <div className="p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl bg-ink overflow-hidden shadow-[0_20px_50px_-22px_hsl(var(--ink)/0.55)] p-6"
          >
            {/* Poster ribbon edges */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
            <div className="absolute top-1.5 inset-x-0 h-1 bg-accent" />
            <div className="absolute -top-14 -right-14 h-44 w-44 rounded-full bg-primary/10" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/10" />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-bold tracking-[0.28em] text-primary mb-1">YOUR MONEY</p>
                <h2 className="text-xl font-semibold text-white">Wallet</h2>
                <p className="text-sm text-white/70 mt-1 max-w-md">Available balance updates immediately when withdrawals are approved (reserved).</p>
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/60">Ledger</p>
                <p className="text-lg font-semibold text-white mt-1">KES {Number(walletBalance || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/60">Reserved</p>
                <p className="text-lg font-semibold text-white mt-1">KES {Number(walletReserved || 0).toLocaleString()}</p>
              </div>
              <div className="bg-primary rounded-xl p-4 shadow-sm">
                <p className="text-xs text-white/80">Available</p>
                <p className="text-lg font-semibold text-white mt-1">KES {Number(walletAvailable || 0).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Token Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden"
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Processing Tokens</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tokenLoading
                      ? <span className="text-muted-foreground text-base">Loading...</span>
                      : <><span className="text-sm font-semibold text-muted-foreground mr-0.5">KES</span>{tokenBalance.toLocaleString()}</>
                    }
                  </p>
                  {tokenBalance === 0 ? (
                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                      <span className="text-emerald-600 font-semibold">💡 First test STKs are free</span>
                      <span>· Top up wallet for live payments</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Used to pay M-Pesa STK processing fees</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tokenBalance <= 20 && !tokenLoading && (
                  <span className="animate-pulse text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                    ⚠️ LOW BALANCE
                  </span>
                )}
                <button
                  onClick={() => navigate('/dashboard/tokens')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                >
                  <Zap size={14} />
                  Top Up
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <div
                className="h-1 transition-all duration-700"
                style={{
                  width: `${Math.min((tokenBalance / 1000) * 100, 100)}%`,
                  background: tokenBalance <= 20 ? '#ef4444' : tokenBalance < 100 ? '#f59e0b' : '#00a651'
                }}
              />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.title}
                {...stat}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Charts and Quick Actions Row */}
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <RevenueChart />
            </div>
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          {/* Transactions and Activity Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionsTable limit={6} />
            </div>
            <div className="lg:col-span-1">
              <ActivityTimeline />
            </div>
          </div>
        </div>
      </main>
          <MobileBottomNav />
    </div>
  );
}