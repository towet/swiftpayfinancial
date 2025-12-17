import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define colors for charts
const COLORS = { Success: '#00C49F', Failed: '#FF8042', Pending: '#FFBB28' };

interface AmountStats {
  count: number;
  totalRevenue: number;
}

interface AnalyticsData {
  today: { totalRevenue: number; totalTransactions: number; };
  allTime: { totalRevenue: number; successRate: string; };
  revenueOverTime: { data: { name: string; revenue: number }[]; };
  statusDistribution: { data: { name: string; value: number }[]; };
  totalsByAmount: { [amount: string]: AmountStats; };
  dailyRevenueByAmount: { [date: string]: { [amount: string]: number; }; };
}

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>Could not load analytics data.</div>;
  }

  // Prepare data for daily revenue chart
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const uniqueAmounts = analytics.totalsByAmount ? Object.keys(analytics.totalsByAmount) : [];
  const dailyRevenueChartData = analytics.dailyRevenueByAmount ? Object.entries(analytics.dailyRevenueByAmount).map(([date, amounts]) => {
    const entry: { [key: string]: string | number } = { name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    uniqueAmounts.forEach(amount => {
      entry[amount] = (amounts[amount] || 0) * Number(amount);
    });
    return entry;
  }) : [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Analytics</h1>
      <p className="text-gray-600 mt-1">In-depth analysis of your transaction data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {analytics && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Today's Revenue</h3>
              <p className="text-2xl font-bold">KES {analytics.today.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Today's Transactions</h3>
              <p className="text-2xl font-bold">{analytics.today.totalTransactions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">All-Time Revenue</h3>
              <p className="text-2xl font-bold">KES {analytics.allTime.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Success Rate (All Time)</h3>
              <p className="text-2xl font-bold">{analytics.allTime.successRate}</p>
            </div>
          </>
        )}
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Totals by Amount</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics && analytics.totalsByAmount && Object.entries(analytics.totalsByAmount).map(([amount, data]) => (
                  <tr key={amount}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">KES {Number(amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES {data.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Revenue by Amount</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenueChartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {uniqueAmounts.map((amount, index) => (
                <Bar key={amount} dataKey={amount} fill={CHART_COLORS[index % CHART_COLORS.length]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueOverTime.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transaction Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusDistribution.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
