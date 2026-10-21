import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface MiniAppOrder {
  id: string;
  phone_number: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string | null;
  failed_at?: string | null;
  product_id?: string | null;
  quantity?: number | null;
  result_desc?: string | null;
}

const MiniAppOrders = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [orders, setOrders] = useState<MiniAppOrder[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
      const res = await axios.get(`/api/mini-apps/${id}/orders?page=1&limit=50${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load orders',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [id, statusFilter]);

  const formatCurrency = (amount: number) => `KES ${Number(amount || 0).toLocaleString()}`;
  const formatDateTime = (date: string) => new Date(date).toLocaleString('en-KE');

  const filteredCounts = useMemo(() => {
    const counts = { paid: 0, pending: 0, failed: 0 };
    for (const o of orders) {
      const s = String(o.status || '').toLowerCase();
      if (s === 'paid') counts.paid += 1;
      else if (s === 'failed') counts.failed += 1;
      else counts.pending += 1;
    }
    return counts;
  }, [orders]);

  const StatusPill = ({ status }: { status: string }) => {
    const s = String(status || '').toLowerCase();
    const cls =
      s === 'paid'
        ? 'bg-green-500/10 text-green-600 border-green-500/20'
        : s === 'failed'
          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';

    return (
      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${cls}`}>{s || 'pending'}</span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardHeader title="Mini-App Orders" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Orders</h1>
                <p className="text-muted-foreground mt-1">Manage and track orders for this store</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Link to={`/dashboard/mini-apps/${id}/analytics`}>
                  <Button variant="outline">Analytics</Button>
                </Link>
                <Link to="/dashboard/mini-apps">
                  <Button variant="outline">Back to Stores</Button>
                </Link>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="rounded-full"
              >
                All ({orders.length})
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                className="rounded-full"
              >
                Paid ({filteredCounts.paid})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                className="rounded-full"
              >
                Pending ({filteredCounts.pending})
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('failed')}
                className="rounded-full"
              >
                Failed ({filteredCounts.failed})
              </Button>
            </div>

            {loading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">No orders yet</h2>
                    <p className="text-sm text-muted-foreground mt-1">Once customers start buying, orders will appear here.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass p-4 rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 gap-3">
                  {orders.map((o, idx) => (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <StatusPill status={o.status} />
                          <span className="text-sm font-bold">{o.phone_number}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(o.created_at)}
                          {o.result_desc ? ` • ${o.result_desc}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">{formatCurrency(o.amount)}</div>
                        <div className="text-xs text-muted-foreground">Qty {Number(o.quantity || 1)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MiniAppOrders;
