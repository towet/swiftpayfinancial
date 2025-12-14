import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, Activity, Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const timeRanges = ["Today", "Week", "Month", "Year"];

const paymentMethodsData = [
  { name: "M-Pesa Till", value: 65, color: "hsl(239, 84%, 67%)" },
  { name: "M-Pesa Paybill", value: 25, color: "hsl(192, 91%, 43%)" },
  { name: "Card", value: 10, color: "hsl(160, 84%, 39%)" },
];

export default function DashboardAnalytics() {
  const [activeRange, setActiveRange] = useState("Week");
  const [stats, setStats] = useState([
    { 
      title: "Total Revenue", 
      value: "KES 0", 
      change: 0, 
      isPositive: true,
      icon: DollarSign 
    },
    { 
      title: "Total Transactions", 
      value: "0", 
      change: 0, 
      isPositive: true,
      icon: Activity 
    },
    { 
      title: "Unique Customers", 
      value: "0", 
      change: 0, 
      isPositive: true,
      icon: Users 
    },
    { 
      title: "Avg Transaction", 
      value: "KES 0", 
      change: 0, 
      isPositive: true,
      icon: CreditCard 
    },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dashStats = response.data.stats;
      const totalTransactions = dashStats.totalTransactions || 0;
      const totalAmount = dashStats.totalAmount || 0;
      const successfulTransactions = dashStats.successfulTransactions || 0;
      const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0;

      // Update stats
      setStats([
        { 
          title: "Total Revenue", 
          value: `KES ${(totalAmount / 1000).toFixed(1)}K`, 
          change: 12.5, 
          isPositive: true,
          icon: DollarSign 
        },
        { 
          title: "Total Transactions", 
          value: totalTransactions.toString(), 
          change: 8.2, 
          isPositive: true,
          icon: Activity 
        },
        { 
          title: "Successful Payments", 
          value: successfulTransactions.toString(), 
          change: 5.1, 
          isPositive: true,
          icon: Users 
        },
        { 
          title: "Avg Transaction", 
          value: `KES ${avgTransaction}`, 
          change: -2.3, 
          isPositive: false,
          icon: CreditCard 
        },
      ]);

      // Generate chart data from transactions
      const transactionsResponse = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const transactions = transactionsResponse.data.transactions || [];
      
      // Group transactions by date
      const groupedByDate: { [key: string]: { revenue: number; transactions: number } } = {};
      transactions.forEach((tx: any) => {
        const date = new Date(tx.created_at).toLocaleDateString();
        if (!groupedByDate[date]) {
          groupedByDate[date] = { revenue: 0, transactions: 0 };
        }
        groupedByDate[date].revenue += tx.amount;
        groupedByDate[date].transactions += 1;
      });

      const chartDataArray = Object.entries(groupedByDate).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        transactions: data.transactions
      }));

      setChartData(chartDataArray.length > 0 ? chartDataArray : generateDefaultChartData());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
      setChartData(generateDefaultChartData());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        revenue: 0,
        transactions: 0
      });
    }
    return data;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-3 border border-border">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-bold gradient-text">
            KES {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Analytics" 
          breadcrumbs={["Dashboard", "Analytics"]} 
        />

        <div className="p-6 space-y-6">
          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <h2 className="text-xl font-semibold text-foreground">Performance Overview</h2>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all",
                    activeRange === range
                      ? "gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-2 text-sm",
                      stat.isPositive ? "text-success" : "text-destructive"
                    )}>
                      {stat.isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(stat.change)}%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg gradient-primary">
                    <stat.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(239, 84%, 67%)"
                      strokeWidth={2}
                      fill="url(#colorRevenue2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Transaction Volume */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Transaction Volume</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(222, 47%, 8%)", 
                        border: "1px solid hsl(217, 33%, 17%)",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="transactions" 
                      fill="hsl(192, 91%, 43%)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Payment Methods</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Hourly Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Hourly Activity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                    <XAxis dataKey="hour" stroke="hsl(215, 20%, 65%)" fontSize={10} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(222, 47%, 8%)", 
                        border: "1px solid hsl(217, 33%, 17%)",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="transactions" 
                      fill="hsl(239, 84%, 67%)" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}