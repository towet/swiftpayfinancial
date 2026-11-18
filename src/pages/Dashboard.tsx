import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TokenWarningBanner } from "@/components/dashboard/TokenWarningBanner";
import { StatCard } from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DollarSign, Receipt, CreditCard, TrendingUp } from "lucide-react";
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
  const { toast } = useToast();

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

      const [statsResponse, tillsResponse, walletResponse] = await Promise.all([
        axios.get("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/tills", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

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
      setStats([
        {
          title: "Total Revenue",
          value: dashStats.totalAmount || 0,
          icon: DollarSign,
          trend: { value: 12.5, isPositive: true },
          prefix: "KES ",
        },
        {
          title: "Total Transactions",
          value: totalTransactions,
          icon: Receipt,
          trend: { value: 8.2, isPositive: true },
        },
        {
          title: "Active Tills",
          value: activeTills,
          icon: CreditCard,
          trend: { value: 2, isPositive: true },
        },
        {
          title: "Success Rate",
          value: parseFloat(successRate as string),
          icon: TrendingUp,
          trend: { value: 0.5, isPositive: true },
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

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader title="Dashboard" breadcrumbs={["Home", "Overview"]} />
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
    </div>
  );
}