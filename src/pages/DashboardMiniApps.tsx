import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MiniAppBuilder } from "@/components/dashboard/MiniAppBuilder";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Store, Plus, RefreshCw, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState, useEffect } from "react";

interface MiniApp {
  id: string;
  title: string;
  slug: string;
  description: string;
  theme_config: any;
  created_at: string;
  analytics?: {
    totalRevenue: number;
    totalOrders: number;
    uniqueCustomers: number;
    totalProducts: number;
  };
}

const DashboardMiniApps = () => {
  const [miniApps, setMiniApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchMiniApps();
  }, []);

  const fetchMiniApps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/mini-apps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apps = response.data.mini_apps || [];

      // Fetch analytics for each app
      const appsWithAnalytics = await Promise.all(
        apps.map(async (app: MiniApp) => {
          try {
            const analyticsRes = await axios.get(`/api/mini-apps/${app.id}/analytics?range=7d`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              ...app,
              analytics: analyticsRes.data.analytics?.overview || {
                totalRevenue: 0,
                totalOrders: 0,
                uniqueCustomers: 0,
                totalProducts: 0
              }
            };
          } catch (error) {
            return {
              ...app,
              analytics: {
                totalRevenue: 0,
                totalOrders: 0,
                uniqueCustomers: 0,
                totalProducts: 0
              }
            };
          }
        })
      );

      setMiniApps(appsWithAnalytics);
    } catch (error) {
      console.error('Failed to fetch mini-apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async (appId: string) => {
    setRefreshing(appId);
    try {
      const token = localStorage.getItem('token');
      const analyticsRes = await axios.get(`/api/mini-apps/${appId}/analytics?range=7d`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMiniApps(prev =>
        prev.map(app =>
          app.id === appId
            ? { ...app, analytics: analyticsRes.data.analytics?.overview || {} }
            : app
        )
      );
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(null);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const getPerformanceColor = (revenue: number) => {
    if (revenue > 10000) return 'text-green-500';
    if (revenue > 5000) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getPerformanceIcon = (revenue: number) => {
    if (revenue > 10000) return '🔥';
    if (revenue > 5000) return '⭐';
    return '📊';
  };

  const totalOverview = miniApps.reduce(
    (acc, app) => {
      const a = app.analytics;
      if (!a) return acc;
      return {
        totalRevenue: acc.totalRevenue + (Number(a.totalRevenue) || 0),
        totalOrders: acc.totalOrders + (Number(a.totalOrders) || 0),
        uniqueCustomers: acc.uniqueCustomers + (Number(a.uniqueCustomers) || 0),
        totalProducts: acc.totalProducts + (Number(a.totalProducts) || 0)
      };
    },
    { totalRevenue: 0, totalOrders: 0, uniqueCustomers: 0, totalProducts: 0 }
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardHeader title="Mini-Apps" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-3xl font-bold tracking-tight">Mini-Apps</h1>
              <p className="text-muted-foreground">
                Create and manage your zero-code storefronts for social commerce.
              </p>
            </motion.div>

            {!loading && miniApps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sales</p>
                      <p className="text-2xl font-black mt-1">{formatCurrency(totalOverview.totalRevenue)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Orders</p>
                      <p className="text-2xl font-black mt-1">{totalOverview.totalOrders}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customers</p>
                      <p className="text-2xl font-black mt-1">{totalOverview.uniqueCustomers}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Products</p>
                      <p className="text-2xl font-black mt-1">{totalOverview.totalProducts}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="glass p-5 rounded-2xl border border-white/10">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-8 w-32 bg-white/10 rounded mt-3" />
                  </div>
                ))}
              </div>
            )}

            {!loading && miniApps.length === 0 && (
              <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">Create your first store</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Build a storefront below, add products, and start collecting payments instantly.
                    </p>
                    <div className="mt-4">
                      <Button
                        className="rounded-full"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start Building
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Stores */}
            {!loading && miniApps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">My Stores</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMiniApps()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {miniApps.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all group"
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                            <Store className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => refreshAnalytics(app.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Refresh Analytics"
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing === app.id ? 'animate-spin' : ''}`} />
                            </button>
                            <Link to={`/dashboard/mini-apps/${app.id}/analytics`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View Analytics">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/dashboard/mini-apps/${app.id}/orders`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View Orders">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Store Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{app.title}</h3>
                            <span className="text-lg">{getPerformanceIcon(app.analytics?.totalRevenue || 0)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{app.description || 'No description'}</p>
                        </div>

                        {/* Quick Stats */}
                        {app.analytics && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="text-center p-2 bg-white/5 rounded-lg">
                              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
                              <p className="text-xs font-bold">{formatCurrency(app.analytics.totalRevenue)}</p>
                              <p className="text-[10px] text-muted-foreground">Revenue</p>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded-lg">
                              <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                              <p className="text-xs font-bold">{app.analytics.totalOrders}</p>
                              <p className="text-[10px] text-muted-foreground">Orders</p>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded-lg">
                              <Users className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                              <p className="text-xs font-bold">{app.analytics.uniqueCustomers}</p>
                              <p className="text-[10px] text-muted-foreground">Customers</p>
                            </div>
                          </div>
                        )}

                        {/* Performance Badge */}
                        {app.analytics && (
                          <div className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${getPerformanceColor(app.analytics.totalRevenue)} bg-white/5`}>
                            {app.analytics.totalRevenue > 10000 && '🔥 Hot Store'}
                            {app.analytics.totalRevenue > 5000 && app.analytics.totalRevenue <= 10000 && '⭐ Growing'}
                            {app.analytics.totalRevenue <= 5000 && '📊 New Store'}
                          </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <Link to={`/dashboard/mini-apps/${app.id}/orders`}>
                              <Button variant="outline" size="sm" className="rounded-full text-xs">
                                Orders
                              </Button>
                            </Link>
                            <Link to={`/shop/${app.slug}`} target="_blank">
                              <Button variant="outline" size="sm" className="rounded-full text-xs">
                                View Store
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Create New Store Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center min-h-[280px] hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Create New Store</p>
                        <p className="text-sm text-muted-foreground">Build your storefront below</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            <MiniAppBuilder />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardMiniApps;
