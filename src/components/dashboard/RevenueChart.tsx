import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const timeRanges = ["Today", "Week", "Month", "Year"];

interface RevenueData { date: string; revenue: number; transactions: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-border shadow-lg p-3 min-w-[140px]">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-green-600">KES {payload[0].value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{payload[0].payload.transactions} transactions</p>
    </div>
  );
};

export function RevenueChart() {
  const [activeRange, setActiveRange] = useState("Week");
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchRevenueData(); }, [activeRange]);

  useEffect(() => {
    const handler = () => fetchRevenueData();
    window.addEventListener('swiftpay:data-refresh', handler as any);
    const ch = new BroadcastChannel('swiftpay-refresh');
    ch.onmessage = () => fetchRevenueData();
    return () => { window.removeEventListener('swiftpay:data-refresh', handler as any); ch.close(); };
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/dashboard/analytics", {
        headers: { Authorization: `Bearer ${token}` },
        params: { range: activeRange.toLowerCase() },
      });
      const rows = (res.data.analytics?.revenueOverTime || []).map((i: any) => ({
        date: i.date, revenue: i.revenue || 0, transactions: i.transactions || 0,
      }));
      setData(rows);
    } catch {
      toast({ title: "Error", description: "Failed to load revenue data", variant: "destructive" });
      setData([]);
    } finally { setLoading(false); }
  };

  const fmt = (v: number) =>
    v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `${(v/1_000).toFixed(0)}K`
    : String(v);

  const total = data.reduce((s, r) => s + r.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-50 border border-green-200">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Revenue Overview</h3>
            <p className="text-xs text-muted-foreground">
              Total: <span className="font-bold text-green-600">KES {total.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-muted self-start sm:self-auto">
          {timeRanges.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200",
                activeRange === r
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-60 sm:h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-green-500 border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <p className="text-sm">No revenue data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00a651" stopOpacity={0.3} />
                  <stop offset="60%"  stopColor="#00a651" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#00a651" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(220 15% 60%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(220 15% 60%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#00a651"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#00a651", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
