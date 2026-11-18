import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Receipt, Key, Bell, LogIn, Settings, Loader2, Activity } from "lucide-react";
import { cn, formatTimeInAppTz } from "@/lib/utils";
import axios from "axios";

const iconMap   = { transaction: Receipt, api_key: Key, webhook: Bell, login: LogIn, settings: Settings };
const colorMap  = {
  transaction: "bg-green-50 text-green-600 border border-green-200",
  api_key:     "bg-blue-50 text-blue-600 border border-blue-200",
  webhook:     "bg-orange-50 text-orange-600 border border-orange-200",
  login:       "bg-purple-50 text-purple-600 border border-purple-200",
  settings:    "bg-slate-100 text-slate-600 border border-slate-200",
};

interface ActivityLog {
  id: string;
  type: keyof typeof iconMap;
  message: string;
  timestamp: string;
}

export function ActivityTimeline() {
  const [logs, setLogs]       = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => {
    const handler = () => fetchLogs();
    window.addEventListener('swiftpay:data-refresh', handler as any);
    const ch = new BroadcastChannel('swiftpay-refresh');
    ch.onmessage = () => fetchLogs();
    return () => { window.removeEventListener('swiftpay:data-refresh', handler as any); ch.close(); };
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } });
      const txs   = res.data.transactions || [];
      setLogs(txs.slice(0, 6).map((tx: any) => ({
        id: tx.id,
        type: "transaction" as const,
        message: `KES ${Number(tx.amount).toLocaleString()} from ${tx.phone_number}`,
        timestamp: tx.created_at,
      })));
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
          <Activity className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-base font-bold text-foreground">Recent Activity</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Activity className="h-7 w-7 opacity-30" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : logs.map((log, i) => {
          const Icon = iconMap[log.type];
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 group"
            >
              {/* Icon + connector line */}
              <div className="relative shrink-0">
                <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", colorMap[log.type])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {i < logs.length - 1 && (
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 w-px h-4 bg-border" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium text-foreground leading-snug truncate">{log.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeInAppTz(log.timestamp)}</p>
              </div>

              {/* Green dot */}
              <div className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-green-400 opacity-70" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
