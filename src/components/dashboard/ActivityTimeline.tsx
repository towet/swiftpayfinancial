import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Receipt, Key, Bell, LogIn, Settings, Loader2 } from "lucide-react";
import { cn, formatTimeInAppTz } from "@/lib/utils";
import axios from "axios";

const iconMap = {
  transaction: Receipt,
  api_key: Key,
  webhook: Bell,
  login: LogIn,
  settings: Settings,
};

const colorMap = {
  transaction: "text-success bg-success/20",
  api_key: "text-primary bg-primary/20",
  webhook: "text-accent bg-accent/20",
  login: "text-warning bg-warning/20",
  settings: "text-muted-foreground bg-muted",
};

interface ActivityLog {
  id: string;
  type: keyof typeof iconMap;
  message: string;
  timestamp: string;
}

export function ActivityTimeline() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch transactions to generate activity logs
      const response = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const transactions = response.data.transactions || [];
      
      // Generate activity logs from transactions
      const logs: ActivityLog[] = transactions.slice(0, 5).map((tx: any) => ({
        id: tx.id,
        type: "transaction" as const,
        message: `Payment received: KES ${tx.amount} from ${tx.phone_number}`,
        timestamp: tx.created_at,
      }));

      setActivityLogs(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      // Set empty logs on error
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return formatTimeInAppTz(timestamp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : activityLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
        ) : (
          activityLogs.map((log, index) => {
            const Icon = iconMap[log.type];
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 group"
              >
                <div className="relative">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-transform duration-200 group-hover:scale-110",
                      colorMap[log.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < activityLogs.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.message}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}