import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Zap,
  Target,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const timeRanges = ["Today", "Week", "Month", "Year"];

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function TillAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("Week");
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [amountInsightsRange, setAmountInsightsRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchAnalytics();
  }, [id, activeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const periodMap: { [key: string]: string } = {
        "Today": "1d",
        "Week": "7d",
        "Month": "30d",
        "Year": "1y"
      };
      const response = await axios.get(`/api/super-admin/tills/${id}/analytics?period=${periodMap[activeRange]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const { till, summary, dailyRevenue, weeklyRevenue, monthlyRevenue, hourlyRevenue, peakHours, commonAmounts, customerTypes, dailyVolume, transactions } = analytics;
  const allTransactions = transactions || [];

  const buildRevenueSeries = (txs: any[], range: string) => {
    const paidTxs = (txs || []).filter((t: any) => t.status === 'success' || t.status === 'paid' || t.status === 'completed');

    if (range === 'Today') {
      const buckets = Array.from({ length: 24 }, (_, hour) => ({
        date: `${String(hour).padStart(2, '0')}:00`,
        revenue: 0,
        transactions: 0
      }));
      paidTxs.forEach((t: any) => {
        const hour = new Date(t.created_at).getHours();
        buckets[hour].revenue += Number(t.amount || 0);
        buckets[hour].transactions += 1;
      });
      return buckets;
    }

    if (range === 'Week' || range === 'Month') {
      const days = range === 'Week' ? 7 : 30;
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - (days - 1));

      const dayMap = new Map<string, { revenue: number; transactions: number }>();
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { revenue: 0, transactions: 0 });
      }

      paidTxs.forEach((t: any) => {
        const d = new Date(t.created_at);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        const bucket = dayMap.get(key);
        if (!bucket) return;
        bucket.revenue += Number(t.amount || 0);
        bucket.transactions += 1;
      });

      return Array.from(dayMap.entries()).map(([date, v]) => ({
        date,
        revenue: v.revenue,
        transactions: v.transactions
      }));
    }

    const months = 12;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const monthMap = new Map<string, { revenue: number; transactions: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = d.toISOString().slice(0, 7);
      monthMap.set(key, { revenue: 0, transactions: 0 });
    }

    paidTxs.forEach((t: any) => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      if (!bucket) return;
      bucket.revenue += Number(t.amount || 0);
      bucket.transactions += 1;
    });

    return Array.from(monthMap.entries()).map(([ym, v]) => ({
      date: `${ym}-01`,
      revenue: v.revenue,
      transactions: v.transactions
    }));
  };

  const revenueSeries = buildRevenueSeries(allTransactions, activeRange);

  const filterTransactionsByLookbackDays = (txs: any[], days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    return (txs || []).filter((t: any) => {
      const createdAt = new Date(t.created_at);
      return createdAt >= start && createdAt <= end;
    });
  };

  const buildAmountStats = (txs: any[]) => {
    const groups = new Map<number, {
      amount: number;
      total: number;
      totalAmount: number;
      success: number;
      successAmount: number;
      failed: number;
      failedAmount: number;
      pending: number;
      pendingAmount: number;
    }>();

    (txs || []).forEach((tx: any) => {
      const amount = Number(tx.amount || 0);
      const key = amount;
      const current = groups.get(key) || {
        amount,
        total: 0,
        totalAmount: 0,
        success: 0,
        successAmount: 0,
        failed: 0,
        failedAmount: 0,
        pending: 0,
        pendingAmount: 0
      };

      current.total += 1;
      current.totalAmount += amount;

      if (tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed') {
        current.success += 1;
        current.successAmount += amount;
      } else if (tx.status === 'failed') {
        current.failed += 1;
        current.failedAmount += amount;
      } else {
        current.pending += 1;
        current.pendingAmount += amount;
      }

      groups.set(key, current);
    });

    return Array.from(groups.values()).map((g) => ({
      ...g,
      successRate: g.total > 0 ? (g.success / g.total) * 100 : 0,
      failureRate: g.total > 0 ? (g.failed / g.total) * 100 : 0
    }));
  };

  const amountStats = buildAmountStats(allTransactions).sort((a, b) => b.total - a.total);
  const amountInsightsTxs = filterTransactionsByLookbackDays(
    allTransactions,
    amountInsightsRange === 'daily' ? 1 : amountInsightsRange === 'weekly' ? 7 : 30
  );
  const amountInsightsStats = buildAmountStats(amountInsightsTxs);

  const filteredTransactions = allTransactions.filter((tx: any) => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'success') {
      return tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed';
    }
    if (transactionFilter === 'failed') return tx.status === 'failed';
    return tx.status === 'pending';
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const calculateStatusTotals = (txs: any[]) => {
    const success = txs.filter(t => t.status === 'success' || t.status === 'paid' || t.status === 'completed');
    const failed = txs.filter(t => t.status === 'failed');
    const pending = txs.filter(t => t.status === 'pending');
    
    return {
      success: {
        count: success.length,
        amount: success.reduce((sum, t) => sum + (t.amount || 0), 0)
      },
      failed: {
        count: failed.length,
        amount: failed.reduce((sum, t) => sum + (t.amount || 0), 0)
      },
      pending: {
        count: pending.length,
        amount: pending.reduce((sum, t) => sum + (t.amount || 0), 0)
      },
      total: {
        count: txs.length,
        amount: txs.reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    };
  };

  const statusTotals = calculateStatusTotals(allTransactions);

  const calculateAmountInsights = (txs: any[]) => {
    const amountGroups: { [key: number]: any } = {};
    
    txs.forEach(tx => {
      const amount = tx.amount || 0;
      if (!amountGroups[amount]) {
        amountGroups[amount] = {
          amount,
          success: 0,
          failed: 0,
          pending: 0,
          total: 0,
          revenue: 0,
          hours: Array(24).fill(0)
        };
      }
      amountGroups[amount].total++;
      if (tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed') {
        amountGroups[amount].success++;
        amountGroups[amount].revenue += amount;
      } else if (tx.status === 'failed') {
        amountGroups[amount].failed++;
      } else if (tx.status === 'pending') {
        amountGroups[amount].pending++;
      }
      const hour = new Date(tx.created_at).getHours();
      amountGroups[amount].hours[hour]++;
    });

    const insights = Object.values(amountGroups).map((group: any) => {
      const peakHour = group.hours.indexOf(Math.max(...group.hours));
      return {
        ...group,
        successRate: group.total > 0 ? (group.success / group.total) * 100 : 0,
        failureRate: group.total > 0 ? (group.failed / group.total) * 100 : 0,
        peakHour
      };
    });

    return {
      topByRevenue: insights.sort((a, b) => b.revenue - a.revenue),
      bestSuccessRate: insights.filter(i => i.total >= 10).sort((a, b) => b.successRate - a.successRate),
      mostFailed: insights.sort((a, b) => b.failed - a.failed)
    };
  };

  const amountInsights = calculateAmountInsights(amountInsightsTxs);

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
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
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );

  const formatKES = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                  {till.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {till.users?.company_name} • {till.users?.full_name}
                </p>
              </div>
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
              <Button variant="outline" size="icon" onClick={fetchAnalytics}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatKES(summary.totalRevenue)}
            change={12.5}
            icon={DollarSign}
            color="gradient-primary"
          />
          <StatCard
            title="Total Transactions"
            value={summary.totalTransactions.toLocaleString()}
            change={8.2}
            icon={Activity}
            color="gradient-primary"
          />
          <StatCard
            title="Success Rate"
            value={`${summary.successRate}%`}
            change={2.1}
            icon={CheckCircle}
            color="gradient-primary"
          />
          <StatCard
            title="Avg Transaction"
            value={formatKES(parseFloat(summary.avgTransactionValue))}
            change={-1.3}
            icon={Target}
            color="gradient-primary"
          />
        </div>

        {/* Transaction Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Successful"
            value={summary.successfulTransactions.toLocaleString()}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Failed"
            value={summary.failedTransactions.toLocaleString()}
            icon={XCircle}
            color="bg-red-500"
          />
          <StatCard
            title="Pending"
            value={(summary.totalTransactions - summary.successfulTransactions - summary.failedTransactions).toLocaleString()}
            icon={Clock}
            color="bg-yellow-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
                <p className="text-sm text-muted-foreground">Daily revenue over time</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                      <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (activeRange === 'Today') return value;
                      if (activeRange === 'Year') {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short' });
                      }
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      padding: "12px"
                    }}
                    formatter={(value: number) => [formatKES(value), 'Revenue']}
                    labelFormatter={(label) => {
                      if (activeRange === 'Today') return label;
                      if (activeRange === 'Year') {
                        const date = new Date(label);
                        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      }
                      const date = new Date(label);
                      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Peak Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Peak Hours</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyRevenue.map((r: any, i: number) => ({ hour: `${i}:00`, revenue: r.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Amount Transaction Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass rounded-xl p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Amount Transaction Breakdown</h3>
            <p className="text-sm text-muted-foreground">Detailed analysis by transaction amount for {activeRange.toLowerCase()}</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {amountStats.slice(0, 25).map((item: any, index: number) => {
              return (
                <div
                  key={item.amount}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}
                         style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatKES(item.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.total} total transactions
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-green-500">{item.success} success ({formatKES(item.successAmount)})</span>
                        <span className="mx-2">|</span>
                        <span className="text-red-500">{item.failed} failed ({formatKES(item.failedAmount)})</span>
                        <span className="mx-2">|</span>
                        <span className="text-yellow-500">{item.pending} pending ({formatKES(item.pendingAmount)})</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Paid Revenue</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatKES(item.successAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success</p>
                      <p className="text-sm font-semibold text-green-500">
                        {item.success}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-sm font-semibold text-red-500">
                        {item.failed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.successRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Popular Amounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Popular Transaction Amounts</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {amountStats.slice(0, 10).map((item: any, index: number) => (
              <motion.div
                key={item.amount}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 text-center"
              >
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatKES(item.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.total} tx
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Transaction Status Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Transaction Status Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{statusTotals.total.count}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-green-500 mt-1">{statusTotals.success.count}</p>
              <p className="text-sm text-green-500 mt-1">{formatKES(statusTotals.success.amount)}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{statusTotals.failed.count}</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">{statusTotals.pending.count}</p>
            </div>
          </div>
        </motion.div>

        {/* Amount Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Amount Insights</h3>
              <p className="text-sm text-muted-foreground">Deep dive into best-performing, most-failed and time-based performance by amount</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setAmountInsightsRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                    amountInsightsRange === range
                      ? "gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top by Paid Revenue */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Top by Paid Revenue
              </h4>
              <div className="space-y-3">
                {amountInsights.topByRevenue.map((item: any, index: number) => (
                  <div
                    key={item.amount}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">{formatKES(item.amount)}</span>
                      </div>
                      <span className="text-sm font-bold text-green-500">{formatKES(item.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-green-500">{item.success} success</span>
                      <span className="text-red-500">{item.failed} failed</span>
                      <span className="text-yellow-500">{item.pending} pending</span>
                      <span>• peak: {String(item.peakHour).padStart(2, '0')}:00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Success Rate */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Best Success Rate
                <span className="text-xs text-muted-foreground font-normal">(min 10 tx)</span>
              </h4>
              <div className="space-y-3">
                {amountInsights.bestSuccessRate.map((item: any, index: number) => (
                  <div
                    key={item.amount}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">{formatKES(item.amount)}</span>
                      </div>
                      <span className="text-sm font-bold text-green-500">{item.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.success}/{item.total} success • avg paid: {formatKES(item.revenue / (item.success || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Failed */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Most Failed
                <span className="text-xs text-muted-foreground font-normal">Counts</span>
              </h4>
              <div className="space-y-3">
                {amountInsights.mostFailed.map((item: any, index: number) => (
                  <div
                    key={item.amount}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">{formatKES(item.amount)}</span>
                      </div>
                      <span className="text-sm font-bold text-red-500">{item.failed} failed</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      total: {item.total} • failure rate: {item.failureRate.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* All Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">All Transactions</h3>
              <p className="text-sm text-muted-foreground">View all transactions for {activeRange.toLowerCase()}</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary">
              {[/* eslint-disable @typescript-eslint/no-use-before-define */
                { key: 'all', label: 'All' },
                { key: 'success', label: 'Success' },
                { key: 'failed', label: 'Failed' },
                { key: 'pending', label: 'Pending' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTransactionFilter(filter.key as any)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                    transactionFilter === filter.key
                      ? "gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((tx: any, index: number) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed' ? "bg-green-500/20 text-green-500" :
                    tx.status === 'failed' ? "bg-red-500/20 text-red-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                     tx.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatKES(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.phone_number} • {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed' ? "bg-green-500/20 text-green-500" :
                  tx.status === 'failed' ? "bg-red-500/20 text-red-500" :
                  "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {tx.status}
                </span>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for this filter
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
