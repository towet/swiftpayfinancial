import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  MoreVertical,
  Shield,
  Trash2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Clock,
  BarChart3,
  PieChart,
  Eye,
  Ban,
  Play,
  Trophy,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  Database,
  Server,
  CheckSquare,
  Square,
  Calendar,
  FileSpreadsheet,
  Megaphone,
  Layers,
  Target,
  Brain,
  Lock,
  Unlock,
  History,
  AlertOctagon
} from "lucide-react";
import axios from "axios";

interface Analytics {
  totalTills: number;
  activeTills: number;
  totalUsers: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  successRate: string;
  dailyRevenue: Record<string, number>;
  topTills: Array<{
    id: string;
    name: string;
    user_id: string;
    revenue: number;
  }>;
}

interface Till {
  id: string;
  name: string;
  user_id: string;
  status: string;
  created_at: string;
  users: {
    email: string;
    full_name: string;
    company_name: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  phone_number: string;
  till_id: string;
  tills: {
    name: string;
    user_id: string;
  };
  users: {
    email: string;
    full_name: string;
    company_name: string;
  };
}

interface Activity {
  type: string;
  id: string;
  message: string;
  user: string;
  till?: string;
  amount?: number;
  status?: string;
  company?: string;
  timestamp: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  admin: {
    full_name: string;
    email: string;
  };
}

interface AlertRule {
  id: string;
  name: string;
  rule_type: string;
  conditions: any;
  threshold: number;
  enabled: boolean;
  created_at: string;
  admin: {
    full_name: string;
    email: string;
  };
}

interface Anomaly {
  id: string;
  entity_type: string;
  entity_id: string;
  anomaly_type: string;
  severity: string;
  confidence_score: string;
  details: any;
  detected_at: string;
  resolved: boolean;
}

interface SystemHealth {
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string;
  status: string;
  recorded_at: string;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "tills" | "transactions" | "activity" | "audit" | "anomalies" | "health">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tills, setTills] = useState<Till[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [page, setPage] = useState(1);
  const [selectedTills, setSelectedTills] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
    fetchActivity();
    fetchAuditLogs();
    fetchAlertRules();
    fetchAnomalies();
    fetchSystemHealth();
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === "tills") fetchTills();
    if (activeTab === "transactions") fetchTransactions();
  }, [activeTab, page]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/super-admin/analytics?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchTills = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/super-admin/tills?page=${page}&search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setTills(response.data.tills);
      }
    } catch (error) {
      console.error("Error fetching tills:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/super-admin/transactions?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/super-admin/activity?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/super-admin/audit-logs?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setAuditLogs(response.data.logs);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/super-admin/alert-rules", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setAlertRules(response.data.rules);
      }
    } catch (error) {
      console.error("Error fetching alert rules:", error);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/super-admin/anomalies?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setAnomalies(response.data.anomalies);
      }
    } catch (error) {
      console.error("Error fetching anomalies:", error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/super-admin/system-health?hours=24", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setSystemHealth(response.data.metrics || []);
      }
    } catch (error) {
      console.error("Error fetching system health:", error);
    }
  };

  const handleSuspendTill = async (tillId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/super-admin/tills/${tillId}/suspend`, { reason: "Admin action" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Till suspended successfully" });
      fetchTills();
    } catch (error) {
      toast({ title: "Error", description: "Failed to suspend till", variant: "destructive" });
    }
  };

  const handleReactivateTill = async (tillId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/super-admin/tills/${tillId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Till reactivated successfully" });
      fetchTills();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reactivate till", variant: "destructive" });
    }
  };

  const handleDeleteTill = async (tillId: string) => {
    if (!confirm("Are you sure you want to delete this till? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/super-admin/tills/${tillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Till deleted successfully" });
      fetchTills();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete till", variant: "destructive" });
    }
  };

  const handleDetectAnomalies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/super-admin/detect-anomalies", { entityType: "transaction", timeRange: "7d" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        toast({ title: "Success", description: `Detected ${response.data.anomalies.length} anomalies` });
        fetchAnomalies();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to detect anomalies", variant: "destructive" });
    }
  };

  const handleResolveAnomaly = async (anomalyId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/super-admin/anomalies/${anomalyId}/resolve`, { notes: "Resolved by admin" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: "Anomaly resolved successfully" });
      fetchAnomalies();
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve anomaly", variant: "destructive" });
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedTills.size === 0) {
      toast({ title: "Warning", description: "No tills selected" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/super-admin/tills/bulk-suspend", { tillIds: Array.from(selectedTills), reason: "Bulk action" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Success", description: `Suspended ${selectedTills.size} tills` });
      setSelectedTills(new Set());
      fetchTills();
    } catch (error) {
      toast({ title: "Error", description: "Failed to suspend tills", variant: "destructive" });
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass rounded-2xl p-6 border border-border/50 relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm ${change > 0 ? "text-green-500" : "text-red-500"}`}>
              {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-muted-foreground text-sm">{title}</p>
      </div>
    </motion.div>
  );

  const RevenueChart = () => {
    const data = analytics?.dailyRevenue || {};
    const labels = Object.keys(data);
    const values = Object.values(data);
    const maxValue = Math.max(...values, 1);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-border/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
          <div className="flex gap-2">
            {["1d", "7d", "30d"].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
                className={dateRange === range ? "bg-primary text-foreground" : "border-border text-muted-foreground"}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-end gap-2">
          {labels.map((label, i) => (
            <motion.div
              key={label}
              initial={{ height: 0 }}
              animate={{ height: `${(values[i] / maxValue) * 100}%` }}
              transition={{ delay: i * 0.05 }}
              className="flex-1 bg-gradient-to-t from-primary/20 to-primary/80 rounded-t-lg relative group"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border/50">
                KES {values[i].toLocaleString()}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-primary/30 to-transparent rounded-t-lg" />
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {labels.map((label) => (
            <span key={label}>{new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          ))}
        </div>
      </motion.div>
    );
  };

  const ActivityFeed = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Real-time Activity
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchActivity}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              activity.type === "transaction" && activity.status === "completed"
                ? "bg-green-500/20 text-green-500"
                : activity.type === "transaction"
                ? "bg-red-500/20 text-red-500"
                : activity.type === "till_created"
                ? "bg-blue-500/20 text-blue-500"
                : "bg-purple-500/20 text-purple-500"
            }`}>
              {activity.type === "transaction" ? (
                activity.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
              ) : activity.type === "till_created" ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{activity.user}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const TillsTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">All Tills</h3>
        <div className="flex gap-2">
          {selectedTills.size > 0 && (
            <>
              <Button variant="destructive" size="sm" onClick={handleBulkSuspend}>
                <Ban className="w-4 h-4 mr-2" />
                Suspend Selected ({selectedTills.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedTills(new Set())}>
                Clear
              </Button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-secondary/50 border-border text-foreground"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedTills.size === tills.length && tills.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTills(new Set(tills.map(t => t.id)));
                    } else {
                      setSelectedTills(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-border"
                />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Till Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tills.map((till) => (
              <tr key={till.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedTills.has(till.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedTills);
                      if (e.target.checked) {
                        newSelected.add(till.id);
                      } else {
                        newSelected.delete(till.id);
                      }
                      setSelectedTills(newSelected);
                    }}
                    className="w-4 h-4 rounded border-border"
                  />
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => navigate(`/dashboard/super-admin/tills/${till.id}/analytics`)}
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                  >
                    <CreditCard className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-foreground font-medium group-hover:underline">{till.name}</span>
                    <Eye className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{till.users?.full_name || "N/A"}</td>
                <td className="py-3 px-4 text-muted-foreground">{till.users?.company_name || "N/A"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    till.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    {till.status || "Active"}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-sm">
                  {new Date(till.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {till.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuspendTill(till.id)}
                        className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivateTill(till.id)}
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTill(till.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const TransactionsTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">All Transactions</h3>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transaction ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Till</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={String(tx.id)} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-muted-foreground text-sm font-mono">{String(tx.id).slice(0, 8)}...</td>
                <td className="py-3 px-4 text-foreground font-semibold">KES {parseFloat(tx.amount).toLocaleString()}</td>
                <td className="py-3 px-4 text-muted-foreground">{tx.phone_number}</td>
                <td className="py-3 px-4 text-foreground">{tx.tills?.name || "N/A"}</td>
                <td className="py-3 px-4 text-muted-foreground">{tx.users?.full_name || "N/A"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === "completed" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-sm">
                  {new Date(tx.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-20 lg:ml-64 transition-all duration-300">
          <DashboardHeader title="Super Admin" breadcrumbs={["Dashboard", "Super Admin"]} />
          <div className="p-6 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader title="Super Admin" breadcrumbs={["Dashboard", "Super Admin"]} />

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Monitor and manage the entire SwiftPay platform</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Super Admin Access</span>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 mb-6 overflow-x-auto pb-2"
            >
              {[
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tills", label: "Tills", icon: CreditCard },
  { id: "transactions", label: "Transactions", icon: Activity },
  { id: "activity", label: "Activity", icon: Zap },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "anomalies", label: "Anomalies", icon: Brain },
  { id: "health", label: "System Health", icon: Server }
].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`capitalize whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Revenue"
                      value={`KES ${(analytics?.totalRevenue || 0).toLocaleString()}`}
                      icon={DollarSign}
                      color="from-green-500 to-emerald-600"
                    />
                    <StatCard
                      title="Total Tills"
                      value={analytics?.totalTills || 0}
                      icon={CreditCard}
                      color="from-blue-500 to-cyan-600"
                    />
                    <StatCard
                      title="Total Users"
                      value={analytics?.totalUsers || 0}
                      icon={Users}
                      color="from-purple-500 to-pink-600"
                    />
                    <StatCard
                      title="Success Rate"
                      value={`${analytics?.successRate || 0}%`}
                      icon={TrendingUp}
                      color="from-orange-500 to-red-600"
                    />
                  </div>

                  {/* Charts and Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <RevenueChart />
                    </div>
                    <div>
                      <ActivityFeed />
                    </div>
                  </div>

                  {/* Top Tills */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 border border-border/50"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Top Performing Tills
                    </h3>
                    <div className="space-y-3">
                      {analytics?.topTills?.slice(0, 5).map((till, i) => (
                        <motion.div
                          key={till.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              i === 0 ? "bg-yellow-500/20 text-yellow-500" : i === 1 ? "bg-gray-400/20 text-gray-400" : "bg-orange-500/20 text-orange-500"
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{till.name}</p>
                              <p className="text-sm text-muted-foreground">{till.user_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">KES {till.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "tills" && (
                <motion.div
                  key="tills"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TillsTable />
                </motion.div>
              )}

              {activeTab === "transactions" && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TransactionsTable />
                </motion.div>
              )}

              {activeTab === "activity" && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityFeed />
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-6 border border-border/50"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-primary" />
                        Activity Distribution
                      </h3>
                      <div className="space-y-4">
                        {[
                          { label: "Transactions", value: activities.filter(a => a.type === "transaction").length, color: "bg-blue-500" },
                          { label: "New Tills", value: activities.filter(a => a.type === "till_created").length, color: "bg-green-500" },
                          { label: "New Users", value: activities.filter(a => a.type === "user_joined").length, color: "bg-purple-500" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="text-foreground font-medium">{item.value}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / activities.length) * 100}%` }}
                                className={`h-full ${item.color}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === "audit" && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Audit Trail
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAuditLogs}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {auditLogs.map((log, i) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{log.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.entity_type}: {log.entity_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              By: {log.admin?.full_name} ({log.admin?.email})
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "anomalies" && (
                <motion.div
                  key="anomalies"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        AI Anomaly Detection
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleDetectAnomalies}
                          className="bg-primary text-foreground"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Detect Anomalies
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchAnomalies}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {anomalies.map((anomaly, i) => (
                        <motion.div
                          key={anomaly.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-4 rounded-lg border ${
                            anomaly.severity === "critical" ? "bg-red-500/10 border-red-500/30" :
                            anomaly.severity === "high" ? "bg-orange-500/10 border-orange-500/30" :
                            anomaly.severity === "medium" ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-secondary/30 border-border/30"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertOctagon className={`w-4 h-4 ${
                                  anomaly.severity === "critical" ? "text-red-500" :
                                  anomaly.severity === "high" ? "text-orange-500" :
                                  anomaly.severity === "medium" ? "text-yellow-500" :
                                  "text-blue-500"
                                }`} />
                                <span className="text-sm font-medium text-foreground">{anomaly.anomaly_type}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  anomaly.severity === "critical" ? "bg-red-500/20 text-red-500" :
                                  anomaly.severity === "high" ? "bg-orange-500/20 text-orange-500" :
                                  anomaly.severity === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                                  "bg-blue-500/20 text-blue-500"
                                }`}>
                                  {anomaly.severity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Entity: {anomaly.entity_type} - {anomaly.entity_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Confidence: {anomaly.confidence_score}% | Detected: {new Date(anomaly.detected_at).toLocaleString()}
                              </p>
                            </div>
                            {!anomaly.resolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAnomaly(anomaly.id)}
                                className="border-border text-muted-foreground"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "health" && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-6 border border-border/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">API Status</p>
                          <p className="text-lg font-bold text-green-500">Healthy</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Response Time: 45ms
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="glass rounded-2xl p-6 border border-border/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Database</p>
                          <p className="text-lg font-bold text-blue-500">Healthy</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Query Time: 12ms
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="glass rounded-2xl p-6 border border-border/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">M-Pesa Gateway</p>
                          <p className="text-lg font-bold text-purple-500">Healthy</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Success Rate: 98.5%
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 border border-border/50"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      System Metrics (Last 24 Hours)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Requests</span>
                          <span className="text-lg font-bold text-foreground">12,458</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-3/4" />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Error Rate</span>
                          <span className="text-lg font-bold text-green-500">1.2%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[1.2%]" />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Avg Response Time</span>
                          <span className="text-lg font-bold text-foreground">45ms</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[45%]" />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Uptime</span>
                          <span className="text-lg font-bold text-green-500">99.9%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[99.9%]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
