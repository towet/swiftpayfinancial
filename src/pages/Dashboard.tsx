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
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch stats from backend
      const statsResponse = await axios.get("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dashStats = statsResponse.data.stats;

      // Calculate success rate
      const totalTransactions = dashStats.totalTransactions || 0;
      const successfulTransactions = dashStats.successfulTransactions || 0;
      const successRate = totalTransactions > 0 
        ? ((successfulTransactions / totalTransactions) * 100).toFixed(1)
        : 0;

      // Fetch tills count
      const tillsResponse = await axios.get("/api/tills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeTills = tillsResponse.data.tills?.length || 0;

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