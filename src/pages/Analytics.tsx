import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
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
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  today: any;
  thisWeek: any;
  thisMonth: any;
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
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'transactions' | 'success'>('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const data = {
      report: 'SwiftPay Analytics Report',
      generated: new Date().toISOString(),
      summary: analytics[timeRange],
      advancedMetrics: analytics.advancedMetrics,
      statusDistribution: analytics.statusDistribution
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftpay-analytics-${timeRange}-${Date.now()}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Could not load analytics data</div>
      </div>
    );
  }

  const currentData = analytics[timeRange];
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: React.ReactNode; 
    color: string 
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm font-semibold ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-white/70 text-sm mb-1">{title}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-white/70">Advanced insights and performance metrics</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex bg-white/10 backdrop-blur-lg rounded-xl p-1 border border-white/20">
          {(['today', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                timeRange === range 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
        
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`KES ${currentData.totalRevenue.toLocaleString()}`}
          change={12.5}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500/20"
        />
        <StatCard
          title="Transactions"
          value={currentData.totalTransactions}
          change={8.2}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-blue-500/20"
        />
        <StatCard
          title="Success Rate"
          value={currentData.successRate}
          change={2.1}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-emerald-500/20"
        />
        <StatCard
          title="Avg Transaction"
          value={`KES ${currentData.averageTransactionValue}`}
          change={-1.3}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-purple-500/20"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Over Time */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueOverTime}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#revenueGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Transaction Status</h3>
          <ResponsiveContainer width="100%" height={300}>
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
                {analytics.statusDistribution && Object.values(analytics.statusDistribution).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any, name: string) => [
                  `${value} transactions`, 
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {Object.entries(analytics.statusDistribution).map(([key, value], index) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                <span className="text-white/70 text-sm capitalize">{key}: {value.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Peak Hours */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Peak Activity Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(analytics.peakHours)
              .map(([hour, data]: [string, any]) => ({
                hour: `${hour}:00`,
                transactions: data.count,
                revenue: data.revenue
              }))
              .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="transactions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Transaction Amounts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Popular Amounts</h3>
          <div className="space-y-3">
            {analytics.advancedMetrics.topAmounts.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold`} 
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-semibold">KES {item.amount.toLocaleString()}</div>
                    <div className="text-white/50 text-sm">{item.count} transactions</div>
                  </div>
                </div>
                <div className="text-white/70">
                  {((item.count / analytics.allTime.totalTransactions) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-white/70 text-sm">Avg Processing Time</span>
          </div>
          <div className="text-white text-xl font-bold">{analytics.advancedMetrics.avgProcessingTime} min</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-white/70 text-sm">Total Volume</span>
          </div>
          <div className="text-white text-xl font-bold">KES {analytics.advancedMetrics.totalVolume.toLocaleString()}</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-white/70 text-sm">Unique Amounts</span>
          </div>
          <div className="text-white text-xl font-bold">{analytics.advancedMetrics.uniqueAmounts}</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-white/70 text-sm">Conversion Rate</span>
          </div>
          <div className="text-white text-xl font-bold">{analytics.advancedMetrics.conversionRate}</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
