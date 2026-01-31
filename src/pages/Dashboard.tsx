import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
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

        <div className="p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Wallet</h2>
                <p className="text-sm text-muted-foreground mt-1">Available balance updates immediately when withdrawals are approved (reserved).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-secondary/40 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground">Ledger</p>
                <p className="text-lg font-semibold text-foreground mt-1">KES {Number(walletBalance || 0).toLocaleString()}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground">Reserved</p>
                <p className="text-lg font-semibold text-foreground mt-1">KES {Number(walletReserved || 0).toLocaleString()}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-semibold text-foreground mt-1">KES {Number(walletAvailable || 0).toLocaleString()}</p>
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