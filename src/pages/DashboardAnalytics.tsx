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
  amountAnalytics?: {
    range: string;
    amountSummary: Array<{
      amount: number;
      totalCount: number;
      paidCount: number;
      failedCount: number;
      pendingCount: number;
      paidRevenue: number;
      shareOfTransactions: number;
      shareOfPaidRevenue: number;
      failureRate: number;
      successRate?: number;
      avgPaidValue?: number;
    }>;
    topAmountsByPaidRevenue: Array<any>;
    topAmountsBySuccessRate: Array<any>;
    topFailedAmounts: Array<any>;
    amountDailyTotals: Array<any>;
    amountWeeklyTotals: Array<any>;
    amountMonthlyTotals: Array<any>;
    peakHoursByAmount: Record<string, Record<string, any>>;
  };
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

interface TillOption {
  id: string;
  till_name: string;
  till_number?: string;
}

interface GeminiInsightsResponse {
  status: string;
  cached?: boolean;
  available?: boolean;
  generatedAt?: number;
  expiresAt?: number;
  provider?: string;
  model?: string | null;
  aiInsights?: {
    anomalyScore: string;
    insights: Array<{
      type: string;
      title: string;
      description: string;
      severity: string;
      action: string;
    }>;
  };
}

export default function DashboardAnalytics() {
  const [activeRange, setActiveRange] = useState("Week");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amountBreakdownRange, setAmountBreakdownRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [tills, setTills] = useState<TillOption[]>([]);
  const [selectedTillId, setSelectedTillId] = useState<string>('');
  const [geminiInsights, setGeminiInsights] = useState<GeminiInsightsResponse | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedAmount !== null) return;
    const first = analytics?.amountAnalytics?.amountSummary?.[0];
    if (first && typeof first.amount === 'number') {
      setSelectedAmount(first.amount);
    }
  }, [analytics, selectedAmount]);

  const timeRangeMap: { [key: string]: keyof AnalyticsData } = {
    "Today": "today",
    "Week": "thisWeek", 
    "Month": "thisMonth",
    "Year": "thisYear"
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeRange, selectedTillId]);

  useEffect(() => {
    fetchGeminiInsights(false);
  }, [activeRange, selectedTillId]);

  useEffect(() => {
    fetchTills();
  }, []);

  const fetchTills = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/tills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTills(response.data.tills || []);
    } catch (error) {
      // Non-blocking: analytics still works without the selector
    }
  };

  const fetchGeminiInsights = async (force: boolean) => {
    try {
      const token = localStorage.getItem("token");
      setGeminiLoading(true);
      const response = await axios.get("/api/dashboard/ai-insights", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          range: activeRange.toLowerCase(),
          ...(selectedTillId ? { tillId: selectedTillId } : {}),
          ...(force ? { force: true } : {}),
        },
      });
      setGeminiInsights(response.data as GeminiInsightsResponse);
    } catch (error: any) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;
      const fallbackMsg = error?.message || 'Request failed';

      if (status === 429) {
        toast({
          title: "Rate limited",
          description: backendMessage || "Too many AI insight requests. Please try again shortly.",
          variant: "destructive",
        });
        return;
      }

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: backendMessage || "Your session may have expired. Please login again.",
          variant: "destructive",
        });
        return;
      }

      if (status === 404) {
        toast({
          title: "AI Endpoint Not Found",
          description: "Backend route /api/dashboard/ai-insights not found. Restart the server after pulling latest changes.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "AI Insights Error",
        description: backendMessage ? `${backendMessage} (HTTP ${status})` : `${fallbackMsg}${status ? ` (HTTP ${status})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setGeminiLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/dashboard/analytics", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          range: activeRange.toLowerCase(),
          ...(selectedTillId ? { tillId: selectedTillId } : {}),
        },
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

  const downloadCsv = (filename: string, rows: Array<Record<string, any>>) => {
    const escape = (v: any) => {
      const s = String(v ?? '');
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportAmountTableCsv = () => {
    if (!analytics?.amountAnalytics?.amountSummary) return;
    const rows = analytics.amountAnalytics.amountSummary.slice(0, 25).map((a: any) => ({
      amount: a.amount,
      totalCount: a.totalCount,
      paidCount: a.paidCount,
      failedCount: a.failedCount,
      pendingCount: a.pendingCount,
      successRatePct: ((a.totalCount > 0 ? (a.paidCount / a.totalCount) : 0) * 100).toFixed(2),
      failureRatePct: ((a.totalCount > 0 ? (a.failedCount / a.totalCount) : 0) * 100).toFixed(2),
      paidRevenue: a.paidRevenue,
      shareOfTransactionsPct: ((a.shareOfTransactions || 0) * 100).toFixed(2),
      shareOfPaidRevenuePct: ((a.shareOfPaidRevenue || 0) * 100).toFixed(2),
    }));
    downloadCsv(`swiftpay-amount-performance-${activeRange}${selectedTillId ? `-till-${selectedTillId}` : ''}-${Date.now()}.csv`, rows);
  };

  const exportSelectedAmountBreakdownCsv = () => {
    if (!analytics?.amountAnalytics || selectedAmount === null) return;
    const aa = analytics.amountAnalytics;
    let source: any[] = [];
    if (amountBreakdownRange === 'daily') source = aa.amountDailyTotals || [];
    else if (amountBreakdownRange === 'weekly') source = aa.amountWeeklyTotals || [];
    else source = aa.amountMonthlyTotals || [];

    const rows = source
      .filter((r: any) => Number(r.amount) === selectedAmount)
      .map((r: any) => ({
        period: r.date || r.week || r.month,
        amount: selectedAmount,
        paid: r.paidCount || 0,
        failed: r.failedCount || 0,
        pending: r.pendingCount || 0,
        paidRevenue: r.paidRevenue || 0,
      }));
    if (rows.length === 0) return;
    downloadCsv(`swiftpay-amount-breakdown-${selectedAmount}-${amountBreakdownRange}-${activeRange}${selectedTillId ? `-till-${selectedTillId}` : ''}-${Date.now()}.csv`, rows);
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

  const formatKES = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

  const effectiveAiInsights = (geminiInsights?.status === 'success' && geminiInsights.aiInsights)
    ? geminiInsights.aiInsights
    : null;

  const effectiveAnomalyScore = (effectiveAiInsights && effectiveAiInsights.anomalyScore)
    ? effectiveAiInsights.anomalyScore
    : analytics.aiInsights.anomalyScore;

  const aiProviderLabel = (geminiInsights?.status === 'success' && geminiInsights.aiInsights)
    ? (geminiInsights.provider || 'gemini')
    : 'dashboard';

  const aiMeta = (geminiInsights?.status === 'success' && geminiInsights.aiInsights)
    ? {
        cached: Boolean(geminiInsights.cached),
        generatedAt: geminiInsights.generatedAt,
        expiresAt: geminiInsights.expiresAt,
        model: geminiInsights.model,
      }
    : null;

  const amountAnalytics = analytics.amountAnalytics;
  const amountOptions = (amountAnalytics?.amountSummary || []).slice(0, 25);

  const getAmountBreakdownRows = () => {
    if (!amountAnalytics || selectedAmount === null) return [];

    const amount = selectedAmount;
    if (amountBreakdownRange === 'daily') {
      return (amountAnalytics.amountDailyTotals || [])
        .filter((r: any) => Number(r.amount) === amount)
        .map((r: any) => ({
          label: r.date,
          paid: r.paidCount || 0,
          failed: r.failedCount || 0,
          pending: r.pendingCount || 0,
          paidRevenue: r.paidRevenue || 0,
        }));
    }

    if (amountBreakdownRange === 'weekly') {
      return (amountAnalytics.amountWeeklyTotals || [])
        .filter((r: any) => Number(r.amount) === amount)
        .map((r: any) => ({
          label: r.week,
          paid: r.paidCount || 0,
          failed: r.failedCount || 0,
          pending: r.pendingCount || 0,
          paidRevenue: r.paidRevenue || 0,
        }));
    }

    return (amountAnalytics.amountMonthlyTotals || [])
      .filter((r: any) => Number(r.amount) === amount)
      .map((r: any) => ({
        label: r.month,
        paid: r.paidCount || 0,
        failed: r.failedCount || 0,
        pending: r.pendingCount || 0,
        paidRevenue: r.paidRevenue || 0,
      }));
  };

  const amountBreakdownRows = getAmountBreakdownRows();

  const getAmountHourlyRows = () => {
    if (!amountAnalytics?.peakHoursByAmount || selectedAmount === null) return [];
    const perHour = amountAnalytics.peakHoursByAmount[String(selectedAmount)];
    if (!perHour) return [];
    return Object.entries(perHour)
      .map(([h, v]: [string, any]) => ({
        hour: `${String(Number(h)).padStart(2, '0')}:00`,
        paid: Number(v.paidCount || 0),
        failed: Number(v.failedCount || 0),
        pending: Number(v.pendingCount || 0),
        paidRevenue: Number(v.paidRevenue || 0),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  };

  const amountHourlyRows = getAmountHourlyRows();

  const getBestHourForAmount = (amount: number) => {
    if (!amountAnalytics?.peakHoursByAmount) return null;
    const perHour = amountAnalytics.peakHoursByAmount[String(amount)];
    if (!perHour) return null;
    const best = Object.entries(perHour)
      .map(([h, v]: [string, any]) => ({ hour: Number(h), paidRevenue: Number(v.paidRevenue || 0), count: Number(v.count || 0), paidCount: Number(v.paidCount || 0) }))
      .sort((a, b) => (b.paidRevenue - a.paidRevenue) || (b.paidCount - a.paidCount) || (b.count - a.count))[0];
    return best ? { ...best, hourLabel: `${String(best.hour).padStart(2, '0')}:00` } : null;
  };

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
              <select
                className="px-4 py-2 glass rounded-lg border border-border text-foreground"
                value={selectedTillId}
                onChange={(e) => setSelectedTillId(e.target.value)}
              >
                <option value="">All Tills</option>
                {tills.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.till_name || t.id}
                  </option>
                ))}
              </select>
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

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={`KES ${currentData.totalRevenue.toLocaleString()}`}
              change={12.5}
              icon={DollarSign}
              color="gradient-primary"
            />
            <StatCard
              title="Transactions"
              value={currentData.totalTransactions}
              change={8.2}
              icon={Activity}
              color="gradient-primary"
            />
            <StatCard
              title="Success Rate"
              value={currentData.successRate}
              change={2.1}
              icon={CheckCircle}
              color="gradient-primary"
            />
            <StatCard
              title="Avg Transaction"
              value={`KES ${currentData.averageTransactionValue}`}
              change={-1.3}
              icon={CreditCard}
              color="gradient-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Successful"
              value={currentData.successfulTransactions}
              icon={CheckCircle}
              color="bg-green-500"
            />
            <StatCard
              title="Failed"
              value={currentData.failedTransactions}
              icon={XCircle}
              color="bg-red-500"
            />
            <StatCard
              title="Pending"
              value={currentData.pendingTransactions}
              icon={Clock}
              color="bg-yellow-500"
            />
          </div>

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
              <h3 className="text-lg font-semibold text-foreground mb-6">Peak Activity Hours</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics.peakHours)
                    .map(([hour, data]: [string, any]) => ({
                      hour: `${hour}:00`,
                      transactions: data.count,
                      revenue: data.revenue
                    }))
                    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="transactions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {amountAnalytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Amount Insights</h3>
                  <p className="text-sm text-muted-foreground">Deep dive into best-performing, most-failed and time-based performance by amount</p>
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  <div className="flex gap-1 p-1 rounded-lg bg-secondary">
                    {([
                      { key: 'daily', label: 'Daily' },
                      { key: 'weekly', label: 'Weekly' },
                      { key: 'monthly', label: 'Monthly' },
                    ] as const).map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setAmountBreakdownRange(r.key)}
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                          amountBreakdownRange === r.key
                            ? "gradient-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <select
                    className="px-3 py-2 rounded-lg bg-secondary text-foreground border border-border"
                    value={selectedAmount ?? ''}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                  >
                    {amountOptions.map((a) => (
                      <option key={a.amount} value={a.amount}>
                        {`KES ${a.amount.toLocaleString()} (tx: ${a.totalCount})`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={exportAmountTableCsv}
                    className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Amount CSV
                  </button>

                  <button
                    onClick={exportSelectedAmountBreakdownCsv}
                    className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Breakdown CSV
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Top by Paid Revenue</h4>
                    <span className="text-xs text-muted-foreground">Range: {amountAnalytics.range}</span>
                  </div>
                  <div className="space-y-2">
                    {amountAnalytics.topAmountsByPaidRevenue.slice(0, 5).map((a: any, idx: number) => {
                      const best = getBestHourForAmount(a.amount);
                      return (
                        <button
                          key={a.amount}
                          onClick={() => setSelectedAmount(Number(a.amount))}
                          className={cn(
                            "w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all",
                            selectedAmount === a.amount && "ring-1 ring-primary/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-foreground font-semibold">
                              <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                              <span className="text-sky-200 font-mono">KES {Number(a.amount).toLocaleString()}</span>
                            </div>
                            <div className="text-emerald-300 text-sm font-semibold">{formatKES(a.paidRevenue)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-300 font-medium">{a.paidCount} success</span>
                            {" "}|{" "}
                            <span className="text-red-300 font-medium">{a.failedCount} failed</span>
                            {" "}|{" "}
                            <span className="text-amber-300 font-medium">{a.pendingCount} pending</span>
                            {best ? (
                              <>
                                {" "}|{" "}
                                <span className="text-sky-200">peak: {best.hourLabel}</span>
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Best Success Rate</h4>
                    <span className="text-xs text-muted-foreground">min 10 tx</span>
                  </div>
                  <div className="space-y-2">
                    {amountAnalytics.topAmountsBySuccessRate.slice(0, 5).map((a: any, idx: number) => (
                      <button
                        key={a.amount}
                        onClick={() => setSelectedAmount(Number(a.amount))}
                        className={cn(
                          "w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all",
                          selectedAmount === a.amount && "ring-1 ring-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-foreground font-semibold">
                            <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                            <span className="text-sky-200 font-mono">KES {Number(a.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-emerald-300 text-sm font-semibold">
                            {((Number(a.successRate || 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="text-emerald-300 font-medium">{a.paidCount}</span>
                          <span className="text-muted-foreground">/{a.totalCount} success</span>
                          {" "}|{" "}
                          <span className="text-sky-200">avg paid: {formatKES(a.avgPaidValue)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Most Failed</h4>
                    <span className="text-xs text-muted-foreground">Counts</span>
                  </div>
                  <div className="space-y-2">
                    {amountAnalytics.topFailedAmounts.slice(0, 5).map((a: any, idx: number) => (
                      <button
                        key={a.amount}
                        onClick={() => setSelectedAmount(Number(a.amount))}
                        className={cn(
                          "w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all",
                          selectedAmount === a.amount && "ring-1 ring-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-foreground font-semibold">
                            <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                            <span className="text-sky-200 font-mono">KES {Number(a.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-red-300 text-sm font-semibold">{a.failedCount} failed</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="text-muted-foreground">total: {a.totalCount}</span>
                          {" "}|{" "}
                          <span className="text-red-300">failure rate: {((Number(a.failureRate || 0)) * 100).toFixed(1)}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">Selected Amount Breakdown</h4>
                    <div className="text-xs text-muted-foreground">
                      {selectedAmount !== null ? `KES ${selectedAmount.toLocaleString()}` : ''}
                    </div>
                  </div>
                  <div className="h-72">
                    {amountBreakdownRows.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No breakdown data for this selection
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={amountBreakdownRows}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                            labelStyle={{ color: "#f3f4f6" }}
                            itemStyle={{ color: "#f3f4f6" }}
                          />
                          <Legend />
                          <Bar dataKey="paid" stackId="a" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="failed" stackId="a" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" stackId="a" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-foreground">Peak Hours (Selected Amount)</h4>
                      <div className="text-xs text-muted-foreground">
                        {selectedAmount !== null ? `KES ${selectedAmount.toLocaleString()}` : ''}
                      </div>
                    </div>
                    <div className="h-72">
                      {amountHourlyRows.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No hourly data for this selection
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={amountHourlyRows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              labelStyle={{ color: "#f3f4f6" }}
                              itemStyle={{ color: "#f3f4f6" }}
                            />
                            <Legend />
                            <Bar dataKey="paid" stackId="a" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="failed" stackId="a" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="pending" stackId="a" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-foreground">Per-Amount Performance (Top 25)</h4>
                      <div className="text-xs text-muted-foreground">Sorted by popularity</div>
                    </div>

                    <div className="overflow-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr className="text-left">
                            <th className="p-3 text-muted-foreground font-medium">Amount</th>
                            <th className="p-3 text-muted-foreground font-medium">Total</th>
                            <th className="p-3 text-muted-foreground font-medium">Success</th>
                            <th className="p-3 text-muted-foreground font-medium">Failed</th>
                            <th className="p-3 text-muted-foreground font-medium">Pending</th>
                            <th className="p-3 text-muted-foreground font-medium">Success %</th>
                            <th className="p-3 text-muted-foreground font-medium">Paid Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amountOptions.map((a) => (
                            <tr
                              key={a.amount}
                              className={cn(
                                "border-t border-border hover:bg-secondary/30 cursor-pointer",
                                selectedAmount === a.amount && "bg-secondary/30"
                              )}
                              onClick={() => setSelectedAmount(a.amount)}
                            >
                              <td className="p-3 font-medium text-foreground">KES {a.amount.toLocaleString()}</td>
                              <td className="p-3 text-foreground">{a.totalCount}</td>
                              <td className="p-3 text-green-400">{a.paidCount}</td>
                              <td className="p-3 text-red-400">{a.failedCount}</td>
                              <td className="p-3 text-yellow-400">{a.pendingCount}</td>
                              <td className="p-3 text-foreground">{((a.totalCount > 0 ? (a.paidCount / a.totalCount) : 0) * 100).toFixed(1)}%</td>
                              <td className="p-3 text-foreground">{formatKES(a.paidRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchGeminiInsights(true)}
                  disabled={geminiLoading}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-secondary/30 transition",
                    geminiLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {geminiLoading ? "Generating…" : "Generate with Gemini"}
                </button>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                effectiveAnomalyScore === 'high' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                Anomaly Score: {effectiveAnomalyScore}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
              <div className="px-2 py-1 rounded-md border border-border">Provider: {aiProviderLabel}</div>
              {aiMeta?.model ? (
                <div className="px-2 py-1 rounded-md border border-border">Model: {aiMeta.model}</div>
              ) : null}
              {aiMeta?.cached ? (
                <div className="px-2 py-1 rounded-md border border-border">Cached</div>
              ) : null}
              {geminiInsights?.status === 'success' && geminiInsights.available === false ? (
                <div className="px-2 py-1 rounded-md border border-border">Not generated yet</div>
              ) : null}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(effectiveAiInsights?.insights || analytics.aiInsights.insights).map((insight, index) => (
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