import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    uniqueCustomers: number;
    totalProducts: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    sales: number;
    revenue: number;
    image_url?: string;
  }>;
  revenueChart: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    product_id?: string;
    phone_number: string;
    amount: number;
    status: string;
    created_at: string;
    paid_at?: string;
  }>;
  inventoryStats: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: string[];
}

const MiniAppAnalytics = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [id, range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/mini-apps/${id}/analytics?range=${range}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.analytics);
    } catch (error: any) {
      toast({
        title: 'Failed to load analytics',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${Number(amount || 0).toLocaleString()}`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: any; icon: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-2xl border border-white/10"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardHeader title="Mini-App Analytics" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">Track your store performance</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-white rounded-full p-1 border border-gray-200">
                  {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        range === r ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-gray-100'
                      }`}
                    >
                      {r === 'all' ? 'All Time' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
                <Button onClick={fetchAnalytics} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {id ? (
                  <Link to={`/dashboard/mini-apps/${id}/orders`}>
                    <Button variant="outline">Orders</Button>
                  </Link>
                ) : null}
                <Link to="/dashboard/mini-apps">
                  <Button variant="outline">Back to Stores</Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">Loading analytics...</p>
                </div>
              </div>
            ) : !analytics ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">No analytics data available</p>
                  <Button onClick={fetchAnalytics} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Revenue" value={formatCurrency(analytics.overview.totalRevenue)} icon={DollarSign} />
                  <StatCard title="Total Orders" value={analytics.overview.totalOrders} icon={ShoppingCart} />
                  <StatCard title="Customers" value={analytics.overview.uniqueCustomers} icon={Users} />
                  <StatCard title="Products" value={analytics.overview.totalProducts} icon={Package} />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-6 rounded-2xl border border-white/10"
                >
                  <h2 className="text-lg font-bold mb-4">Revenue Over Time</h2>
                  <div className="h-64 flex items-end gap-2">
                    {(() => {
                      const maxRevenue = Math.max(...analytics.revenueChart.map((d) => d.revenue), 1);
                      return analytics.revenueChart.map((d, i) => (
                        <motion.div
                          key={d.date}
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                          transition={{ delay: i * 0.05 }}
                          className="flex-1 bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-lg relative group"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {formatCurrency(d.revenue)}
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-6 rounded-2xl border border-white/10"
                  >
                    <h2 className="text-lg font-bold mb-4">Top Products</h2>
                    <div className="space-y-3">
                      {analytics.topProducts.map((product, i) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sales} sold • {formatCurrency(product.revenue)} revenue
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(product.price)}</p>
                            <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-6 rounded-2xl border border-white/10"
                  >
                    <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
                    <div className="space-y-3">
                      {analytics.recentOrders.slice(0, 8).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              String(order.status).toLowerCase() === 'paid'
                                ? 'bg-green-500'
                                : String(order.status).toLowerCase() === 'failed'
                                  ? 'bg-rose-500'
                                  : 'bg-yellow-500'
                            }`}
                          />
                          <div className="flex-1">
                            <p className="font-bold">{order.phone_number}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(order.amount)}</p>
                            <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl border border-white/10"
                  >
                    <h2 className="text-lg font-bold mb-4">Inventory Status</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Products</span>
                        <span className="font-bold">{analytics.inventoryStats.totalProducts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Low Stock (&lt;5)</span>
                        <span className="font-bold text-yellow-500">{analytics.inventoryStats.lowStock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Out of Stock</span>
                        <span className="font-bold text-rose-500">{analytics.inventoryStats.outOfStock}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-primary"
                          style={{
                            width: `${analytics.inventoryStats.totalProducts > 0
                              ? ((analytics.inventoryStats.totalProducts - analytics.inventoryStats.outOfStock) /
                                  analytics.inventoryStats.totalProducts) *
                                100
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl border border-white/10"
                  >
                    <h2 className="text-lg font-bold mb-4">Recent Customers</h2>
                    <div className="space-y-2">
                      {analytics.customers.slice(0, 12).map((phone, i) => (
                        <div
                          key={`${phone}-${i}`}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <p className="font-medium">{phone}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Next: Full Shop HQ</p>
                      <p className="text-sm text-muted-foreground">Orders management, product editing, customers, and more will live here.</p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MiniAppAnalytics;
