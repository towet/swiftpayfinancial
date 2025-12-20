import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  Brain,
  Shield,
  Zap,
  Target,
  Eye,
  BarChart3
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const timeRanges = ["Today", "Week", "Month", "Year"];

const paymentMethodsData = [
  { name: "M-Pesa Till", value: 65, color: "hsl(239, 84%, 67%)" },
  { name: "M-Pesa Paybill", value: 25, color: "hsl(192, 91%, 43%)" },
  { name: "Card", value: 10, color: "hsl(160, 84%, 39%)" },
];

interface AnalyticsData {
  today: any;
  thisWeek: any;
  thisMonth: any;
  thisYear: any;
  allTime: any;
  revenueOverTime: any[];
  peakHours: any;
  statusDistribution: any;
  advancedMetrics: {
    uniqueAmounts: number;
    topAmounts: { amount: number; count: number }[];
    avgProcessingTime: string;
    totalVolume: number;
    conversionRate: string;
  };
  aiInsights: {
    insights: Array<{
      type: string;
      title: string;
      description: string;
      severity: string;
      action: string;
    }>;
    forecast: Array<{
      date: string;
      forecast: number;
      confidence: number;
    }>;
    customerSegments: {
      highValue: { count: number; revenue: number };
      mediumValue: { count: number; revenue: number };
      lowValue: { count: number; revenue: number };
    };
    fraudAlerts: Array<{
      type: string;
      phone: string;
      count: number;
      totalAmount: number;
      severity: string;
    }>;
    anomalyScore: string;
  };
}

export default function DashboardAnalytics() {
  const [activeRange, setActiveRange] = useState("Week");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const timeRangeMap: { [key: string]: keyof AnalyticsData } = {
    "Today": "today",
    "Week": "thisWeek", 
    "Month": "thisMonth",
    "Year": "thisYear"
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/dashboard/analytics", {
        headers: { Authorization: `Bearer ${token}` },
        params: { range: activeRange.toLowerCase() },
      });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const data = {
      report: 'SwiftPay Analytics Report',
      generated: new Date().toISOString(),
      summary: analytics[timeRangeMap[activeRange]],
      advancedMetrics: analytics.advancedMetrics,
      statusDistribution: analytics.statusDistribution
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftpay-analytics-${activeRange}-${Date.now()}.json`;
    a.click();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Could not load analytics</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const currentData = analytics[timeRangeMap[activeRange]];
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const StatCard = ({ title, value, change, icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              change >= 0 ? "text-success" : "text-destructive"
            )}>
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {React.createElement(icon, { className: "h-5 w-5 text-primary-foreground" })}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Advanced Analytics" 
          breadcrumbs={["Dashboard", "Analytics"]} 
        />

        <div className="p-6 space-y-6">
          {/* Time Range Selector and Export */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground">Performance Overview</h2>
              <p className="text-sm text-muted-foreground">Advanced insights and metrics</p>
            </div>
            <div className="flex gap-3">
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
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-primary/10 transition-all"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </motion.div>

          {/* Enhanced Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={`KES ${currentData.totalRevenue.toLocaleString()}`}
              change={12.5}
              icon={DollarSign}
              color="gradient-primary"
            />
            <StatCard
              title="Total Transactions"
              value={currentData.totalTransactions}
              change={8.3}
              icon={CreditCard}
              color="bg-blue-500/20 text-blue-500"
            />
            <StatCard
              title="Successful Transactions"
              value={analytics.statusDistribution.success.count}
              change={15.2}
              icon={CheckCircle}
              color="bg-green-500/20 text-green-500"
            />
            <StatCard
              title="Failed Transactions"
              value={analytics.statusDistribution.failed.count}
              change={-5.1}
              icon={XCircle}
              color="bg-red-500/20 text-red-500"
            />
          </div>

          {/* Additional Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Success Rate"
              value={`${((analytics.statusDistribution.success.count / currentData.totalTransactions) * 100).toFixed(1)}%`}
              change={2.8}
              icon={Target}
              color="bg-purple-500/20 text-purple-500"
            />
            <StatCard
              title="Avg Transaction Value"
              value={`KES ${Math.round(analytics.advancedMetrics.totalVolume / currentData.totalTransactions).toLocaleString()}`}
              change={3.7}
              icon={TrendingUp}
              color="bg-orange-500/20 text-orange-500"
            />
            <StatCard
              title="Peak Hour"
              value={Object.entries(analytics.peakHours).sort(([,a], [,b]) => b.count - a.count)[0]?.[0] + ':00' || 'N/A'}
              change={null}
              icon={Clock}
              color="bg-cyan-500/20 text-cyan-500"
            />
            <StatCard
              title="Unique Amounts"
              value={analytics.advancedMetrics.uniqueAmounts}
              change={12.1}
              icon={BarChart3}
              color="bg-pink-500/20 text-pink-500"
            />
          </div>

          {/* Detailed Amount Analysis Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Best Performing Amounts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Amounts */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Top 5 Amounts by Success Rate</h4>
                <div className="space-y-3">
                  {analytics.advancedMetrics.topAmounts.slice(0, 5).map((item, index) => {
                    const successRate = ((item.count / currentData.totalTransactions) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">KES {item.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{item.count} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-success">{successRate}%</p>
                          <p className="text-xs text-muted-foreground">share</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amount Performance Metrics */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Amount Performance Insights</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Most Popular Amount</span>
                      <span className="font-medium text-foreground">
                        KES {analytics.advancedMetrics.topAmounts[0]?.amount.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Highest Revenue Amount</span>
                      <span className="font-medium text-foreground">
                        KES {Math.max(...analytics.advancedMetrics.topAmounts.map(a => a.amount * a.count)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Amount per Transaction</span>
                      <span className="font-medium text-foreground">
                        KES {Math.round(analytics.advancedMetrics.totalVolume / currentData.totalTransactions).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Time-Based Analytics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Time-Based Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Daily Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Total Transactions</span>
                    <span className="text-sm font-medium">{analytics.today.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Successful</span>
                    <span className="text-sm font-medium text-success">{analytics.today.successfulTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Failed</span>
                    <span className="text-sm font-medium text-destructive">{analytics.today.failedTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium">KES {(analytics.today.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Weekly Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Total Transactions</span>
                    <span className="text-sm font-medium">{analytics.thisWeek.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Successful</span>
                    <span className="text-sm font-medium text-success">{analytics.thisWeek.successfulTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Failed</span>
                    <span className="text-sm font-medium text-destructive">{analytics.thisWeek.failedTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium">KES {(analytics.thisWeek.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Monthly Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Total Transactions</span>
                    <span className="text-sm font-medium">{analytics.thisMonth.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Successful</span>
                    <span className="text-sm font-medium text-success">{analytics.thisMonth.successfulTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Failed</span>
                    <span className="text-sm font-medium text-destructive">{analytics.thisMonth.failedTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium">KES {(analytics.thisMonth.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueOverTime}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--success))" 
                      fillOpacity={1} 
                      fill="url(#revenueGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Transaction Status</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Success', value: analytics.statusDistribution.success.count, amount: analytics.statusDistribution.success.amount },
                        { name: 'Failed', value: analytics.statusDistribution.failed.count, amount: analytics.statusDistribution.failed.amount },
                        { name: 'Pending', value: analytics.statusDistribution.pending.count, amount: analytics.statusDistribution.pending.amount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.values(analytics.statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1f2937", 
                        border: "1px solid #374151",
                        borderRadius: "8px"
                      }}
                      labelStyle={{ color: "#f3f4f6" }}
                      itemStyle={{ color: "#f3f4f6" }}
                      formatter={(value: any, name: string) => [
                        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
                          {`${value} transactions`}
                        </span>, 
                        <span style={{ color: "#ffffff" }}>
                          {name}
                        </span>
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {Object.entries(analytics.statusDistribution).map(([key, value]: [string, any], index) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-muted-foreground text-sm capitalize">{key}: {value?.count || 0}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Peak Activity Hours (with Success Rates)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics.peakHours)
                    .map(([hour, data]: [string, any]) => ({
                      hour: `${hour}:00`,
                      transactions: data.count,
                      successful: data.success || 0,
                      failed: (data.count - (data.success || 0)),
                      revenue: data.revenue,
                      successRate: data.count > 0 ? ((data.success || 0) / data.count * 100).toFixed(1) : 0
                    }))
                    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1f2937", 
                        border: "1px solid #374151",
                        borderRadius: "8px"
                      }}
                      labelStyle={{ color: "#f3f4f6" }}
                      itemStyle={{ color: "#f3f4f6" }}
                      formatter={(value: any, name: string) => [
                        <span style={{ color: "#ffffff" }}>
                          {name === 'successRate' ? `${value}%` : value}
                        </span>, 
                        <span style={{ color: "#ffffff" }}>
                          {name === 'transactions' ? 'Total' : name === 'successful' ? 'Success' : name === 'failed' ? 'Failed' : name === 'revenue' ? 'Revenue' : 'Success Rate'}
                        </span>
                      ]}
                    />
                    <Bar dataKey="successful" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Transaction Amounts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Popular Amounts</h3>
              <div className="space-y-3">
                {analytics.advancedMetrics.topAmounts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold`} 
                           style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-foreground font-semibold">KES {item.amount.toLocaleString()}</div>
                        <div className="text-muted-foreground text-sm">{item.count} transactions</div>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {((item.count / (analytics.allTime.totalTransactions || 1)) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-foreground">AI-Powered Insights</h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                analytics.aiInsights.anomalyScore === 'high' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                Anomaly Score: {analytics.aiInsights.anomalyScore}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.aiInsights.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    insight.severity === 'error' ? 'bg-red-500/10 border-red-500/20' :
                    insight.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    insight.severity === 'success' ? 'bg-green-500/10 border-green-500/20' :
                    'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.severity === 'error' ? 'bg-red-500/20' :
                      insight.severity === 'warning' ? 'bg-yellow-500/20' :
                      insight.severity === 'success' ? 'bg-green-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      {insight.severity === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> :
                       insight.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> :
                       insight.severity === 'success' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                       <Eye className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-xs text-primary">{insight.action}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Predictive Forecast */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-foreground">7-Day Revenue Forecast</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.aiInsights.forecast}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))"
                      }}
                      formatter={(value: any, name: string, props: any) => [
                        <span style={{ color: "hsl(var(--foreground))" }}>
                          {`KES ${value.toLocaleString()}`}
                        </span>, 
                        <span style={{ color: "hsl(var(--foreground))" }}>
                          `Forecast (${props.payload.confidence}% confidence)`
                        </span>
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#forecastGradient)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Customer Segments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-foreground">Customer Segments</h3>
              </div>
              <div className="space-y-4">
                {[
                  { 
                    name: 'High Value', 
                    data: analytics.aiInsights.customerSegments.highValue, 
                    color: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
                    icon: <Zap className="w-4 h-4" />
                  },
                  { 
                    name: 'Medium Value', 
                    data: analytics.aiInsights.customerSegments.mediumValue, 
                    color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
                    icon: <TrendingUp className="w-4 h-4" />
                  },
                  { 
                    name: 'Low Value', 
                    data: analytics.aiInsights.customerSegments.lowValue, 
                    color: 'bg-green-500/20 border-green-500/30 text-green-400',
                    icon: <Users className="w-4 h-4" />
                  }
                ].map((segment, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${segment.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {segment.icon}
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <span className="text-2xl font-bold">{segment.data.count}</span>
                    </div>
                    <div className="text-sm opacity-80">
                      KES {segment.data.revenue.toLocaleString()} total revenue
                    </div>
                    <div className="mt-2 bg-black/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          segment.name === 'High Value' ? 'bg-purple-400' :
                          segment.name === 'Medium Value' ? 'bg-blue-400' :
                          'bg-green-400'
                        }`}
                        style={{ 
                          width: `${(segment.data.revenue / 
                            (analytics.aiInsights.customerSegments.highValue.revenue + 
                             analytics.aiInsights.customerSegments.mediumValue.revenue + 
                             analytics.aiInsights.customerSegments.lowValue.revenue)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Fraud Detection Alerts */}
          {analytics.aiInsights.fraudAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass rounded-xl p-6 border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-foreground">Fraud Detection Alerts</h3>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                  {analytics.aiInsights.fraudAlerts.length} Active Alerts
                </div>
              </div>
              
              <div className="space-y-3">
                {analytics.aiInsights.fraudAlerts.map((alert, index) => (
                  <div key={index} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Suspicious Activity Detected</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Phone: {alert.phone} | {alert.count} transactions in 1 hour
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total amount: KES {alert.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        {alert.severity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-muted-foreground text-sm">Avg Processing Time</span>
              </div>
              <div className="text-foreground text-xl font-bold">{analytics.advancedMetrics.avgProcessingTime} min</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-muted-foreground text-sm">Total Volume</span>
              </div>
              <div className="text-foreground text-xl font-bold">KES {analytics.advancedMetrics.totalVolume.toLocaleString()}</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span className="text-muted-foreground text-sm">Unique Amounts</span>
              </div>
              <div className="text-foreground text-xl font-bold">{analytics.advancedMetrics.uniqueAmounts}</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-muted-foreground text-sm">Conversion Rate</span>
              </div>
              <div className="text-foreground text-xl font-bold">{analytics.advancedMetrics.conversionRate}</div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}