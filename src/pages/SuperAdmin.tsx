import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
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
  AlertOctagon,
  Mail,
  Loader2
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
    users?: {
      email?: string;
      full_name?: string;
      company_name?: string;
    };
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

interface SuperAdminWallet {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  balance?: number;
  users?: {
    email?: string;
    full_name?: string;
    company_name?: string;
    role?: string;
  };
}

interface SuperAdminWalletDetail {
  wallet: SuperAdminWallet;
  balance: number;
  ledger: Array<any>;
  deposits: Array<any>;
  withdrawals: Array<any>;
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

interface SystemHealthSummary {
  [metricType: string]: {
    current: number;
    status: string;
    unit: string;
    trend: number;
  };
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  users?: {
    email?: string;
    full_name?: string;
    company_name?: string;
  };
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "tills" | "transactions" | "wallets" | "withdrawals" | "activity" | "audit" | "anomalies" | "health">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tills, setTills] = useState<Till[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<SuperAdminWallet[]>([]);
  const [walletSearch, setWalletSearch] = useState("");
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<SuperAdminWalletDetail | null>(null);
  const [loadingWalletDetail, setLoadingWalletDetail] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsStatus, setWithdrawalsStatus] = useState<"all" | "pending" | "approved" | "rejected" | "paid">("pending");
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [updatingWithdrawalId, setUpdatingWithdrawalId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ metrics: Record<string, SystemHealth[]>; summary: SystemHealthSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [page, setPage] = useState(1);
  const [selectedTills, setSelectedTills] = useState<Set<string>>(new Set());
  const [sendingOnboardingEmails, setSendingOnboardingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [customEmailSubject, setCustomEmailSubject] = useState("🚀 Get Started with SwiftPay - Create Your First Till");
  const [customEmailBody, setCustomEmailBody] = useState("");
  const [showAdminRecipientsModal, setShowAdminRecipientsModal] = useState(false);
  const [adminRecipientsEnabled, setAdminRecipientsEnabled] = useState(true);
  const [adminRecipientEmails, setAdminRecipientEmails] = useState<string[]>([]);
  const [adminSuperAdminEmails, setAdminSuperAdminEmails] = useState<string[]>([]);
  const [adminAllRecipients, setAdminAllRecipients] = useState<string[]>([]);
  const [adminNewRecipientEmail, setAdminNewRecipientEmail] = useState("");
  const [loadingAdminRecipients, setLoadingAdminRecipients] = useState(false);
  const [savingAdminRecipients, setSavingAdminRecipients] = useState(false);
  const [testingAdminRecipients, setTestingAdminRecipients] = useState(false);
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
    if (activeTab === "wallets") fetchWallets();
    if (activeTab === "withdrawals") fetchWithdrawalRequests();
  }, [activeTab, page, withdrawalsStatus, walletSearch]);

  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/super-admin/wallets?page=${page}&limit=20&search=${encodeURIComponent(walletSearch)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === "success") {
        setWallets(res.data.wallets || []);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      toast({ title: "Error", description: "Failed to load wallets", variant: "destructive" });
    } finally {
      setLoadingWallets(false);
    }
  };

  const fetchWalletDetail = async (walletId: string) => {
    setLoadingWalletDetail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/super-admin/wallets/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status === "success") {
        setSelectedWallet({
          wallet: res.data.wallet,
          balance: Number(res.data.balance || 0),
          ledger: Array.isArray(res.data.ledger) ? res.data.ledger : [],
          deposits: Array.isArray(res.data.deposits) ? res.data.deposits : [],
          withdrawals: Array.isArray(res.data.withdrawals) ? res.data.withdrawals : [],
        });
      }
    } catch (error) {
      console.error("Error fetching wallet detail:", error);
      toast({ title: "Error", description: "Failed to load wallet details", variant: "destructive" });
    } finally {
      setLoadingWalletDetail(false);
    }
  };

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

  const fetchWithdrawalRequests = async () => {
    setLoadingWithdrawals(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/super-admin/withdrawal-requests?page=${page}&limit=20&status=${withdrawalsStatus}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.status === "success") {
        setWithdrawalRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    } finally {
      setLoadingWithdrawals(false);
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
        setSystemHealth({
          metrics: response.data.metrics || {},
          summary: response.data.summary || {}
        });
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

  const handleSendOnboardingEmails = async () => {
    if (!confirm("Send onboarding emails to all users who haven't created a till yet?")) return;
    handleOpenEmailModal();
  };

  const handleOpenEmailModal = () => {
    // Set default email body if not customized
    if (!customEmailBody) {
      const defaultBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SwiftPay!</h1>
  </div>
  <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
      Hi {{full_name}},
    </p>
    <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
      Thanks for signing up for SwiftPay! We noticed you haven't created your first till yet.
    </p>
    <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
      A <strong>till</strong> is your payment collection point — it's where you'll receive M-Pesa payments from your customers. Creating one takes less than 2 minutes.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}/dashboard/tills" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Create Your First Till
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
      If you need help, check out our <a href="{{dashboard_url}}/developers/guide" style="color: #667eea;">developer guide</a>.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      SwiftPay Financial - Building Trust in African Commerce<br>
      <a href="mailto:support@swiftpayfinancial.com" style="color: #9ca3af; text-decoration: none;">support@swiftpayfinancial.com</a>
    </p>
  </div>
</div>`;
      setCustomEmailBody(defaultBody);
    }
    setShowEmailModal(true);
  };

  const isValidEmail = (value: string) => {
    const s = value.trim().toLowerCase();
    if (!s) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  };

  const fetchAdminRecipients = async () => {
    setLoadingAdminRecipients(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/notification-recipients?key=withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.status === "success") {
        setAdminRecipientsEnabled(res.data?.settings?.enabled !== false);
        setAdminRecipientEmails(Array.isArray(res.data?.settings?.emails) ? res.data.settings.emails : []);
        setAdminSuperAdminEmails(Array.isArray(res.data?.superAdminEmails) ? res.data.superAdminEmails : []);
        setAdminAllRecipients(Array.isArray(res.data?.recipients) ? res.data.recipients : []);
      }
    } catch (error: any) {
      toast({
        title: "Notifications",
        description: error?.response?.data?.message || "Failed to load admin notification recipients",
        variant: "destructive",
      });
    } finally {
      setLoadingAdminRecipients(false);
    }
  };

  const handleOpenAdminRecipientsModal = async () => {
    setShowAdminRecipientsModal(true);
    await fetchAdminRecipients();
  };

  const addAdminRecipientEmail = () => {
    const email = adminNewRecipientEmail.trim().toLowerCase();

    if (!isValidEmail(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (adminRecipientEmails.map((e) => e.trim().toLowerCase()).includes(email)) {
      toast({ title: "Already added", description: "This email is already in the list" });
      return;
    }

    if (adminRecipientEmails.length >= 50) {
      toast({ title: "Limit reached", description: "You can add a maximum of 50 emails", variant: "destructive" });
      return;
    }

    setAdminRecipientEmails((prev) => [...prev, email]);
    setAdminNewRecipientEmail("");
  };

  const removeAdminRecipientEmail = (email: string) => {
    setAdminRecipientEmails((prev) => prev.filter((e) => e !== email));
  };

  const saveAdminRecipients = async () => {
    setSavingAdminRecipients(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "/api/super-admin/notification-recipients",
        {
          key: "withdrawals",
          enabled: adminRecipientsEnabled,
          emails: adminRecipientEmails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.status === "success") {
        toast({ title: "Saved", description: "Withdrawal notification recipients updated" });
        setAdminRecipientsEnabled(res.data?.settings?.enabled !== false);
        setAdminRecipientEmails(Array.isArray(res.data?.settings?.emails) ? res.data.settings.emails : []);
        setAdminSuperAdminEmails(Array.isArray(res.data?.superAdminEmails) ? res.data.superAdminEmails : []);
        setAdminAllRecipients(Array.isArray(res.data?.recipients) ? res.data.recipients : []);
      }
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.response?.data?.message || "Failed to save recipients",
        variant: "destructive",
      });
    } finally {
      setSavingAdminRecipients(false);
    }
  };

  const testAdminRecipients = async () => {
    setTestingAdminRecipients(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/super-admin/notification-recipients/test-email",
        { key: "withdrawals" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.status === "success") {
        toast({ title: "Test email sent", description: `Queued to ${Array.isArray(res.data?.recipients) ? res.data.recipients.length : 0} recipients` });
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error?.response?.data?.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTestingAdminRecipients(false);
    }
  };

  const handleUpdateWithdrawalRequest = async (id: string, status: "approved" | "rejected" | "paid") => {
    if (status === "paid" && !confirm("Mark this withdrawal as paid?")) return;
    if (status === "approved" && !confirm("Approve this withdrawal request?")) return;

    let admin_notes: string | undefined;
    if (status === "rejected") {
      const notes = prompt("Reject withdrawal request. Optional notes:") || "";
      admin_notes = notes;
    }

    setUpdatingWithdrawalId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/super-admin/withdrawal-requests/${id}`,
        {
          status,
          ...(admin_notes !== undefined ? { admin_notes } : {}),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast({ title: "Success", description: `Withdrawal marked as ${status}` });
      fetchWithdrawalRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update withdrawal request",
        variant: "destructive",
      });
    } finally {
      setUpdatingWithdrawalId(null);
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

  const WithdrawalRequestsTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">Withdrawal Requests</h3>
        <div className="flex items-center gap-2">
          <select
            value={withdrawalsStatus}
            onChange={(e) => {
              setPage(1);
              setWithdrawalsStatus(e.target.value as any);
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWithdrawalRequests()}
            disabled={loadingWithdrawals}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Request</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawalRequests.map((req) => {
              const s = String(req.status || "").toLowerCase();
              const isPending = s === "pending";
              const isApproved = s === "approved";
              const isRejected = s === "rejected";
              const isPaid = s === "paid";
              const isBusy = updatingWithdrawalId === req.id;

              return (
                <tr key={req.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground text-sm font-mono">{String(req.id).slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {req.users?.company_name || req.users?.full_name || req.users?.email || req.user_id}
                  </td>
                  <td className="py-3 px-4 text-foreground font-semibold">KES {Number(req.amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted-foreground">{req.phone_number}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        isPaid
                          ? "bg-green-500/20 text-green-500"
                          : isApproved
                            ? "bg-blue-500/20 text-blue-500"
                            : isPending
                              ? "bg-yellow-500/20 text-yellow-500"
                              : isRejected
                                ? "bg-red-500/20 text-red-500"
                                : "bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateWithdrawalRequest(req.id, "approved")}
                            disabled={isBusy}
                            className="border-border"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateWithdrawalRequest(req.id, "rejected")}
                            disabled={isBusy}
                            className="border-border"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {isApproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateWithdrawalRequest(req.id, "paid")}
                          disabled={isBusy}
                          className="border-border"
                        >
                          Mark Paid
                        </Button>
                      )}
                      {!isPending && !isApproved && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loadingWithdrawals && withdrawalRequests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No withdrawal requests</p>
          <p className="text-sm mt-1">Requests will appear here when users submit withdrawals</p>
        </div>
      )}
      {loadingWithdrawals && (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      )}
    </motion.div>
  );

  const WalletsTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">All Wallets</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search wallets..."
              value={walletSearch}
              onChange={(e) => {
                setPage(1);
                setWalletSearch(e.target.value);
              }}
              className="pl-9 w-64 bg-secondary/50 border-border text-foreground"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchWallets()} disabled={loadingWallets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {selectedWallet ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm text-muted-foreground">Selected wallet</div>
              <div className="text-lg font-semibold text-foreground">
                {selectedWallet.wallet?.users?.company_name || selectedWallet.wallet?.users?.full_name || selectedWallet.wallet?.users?.email || selectedWallet.wallet.user_id}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{selectedWallet.wallet.id}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="text-xl font-bold text-foreground">KES {Number(selectedWallet.balance || 0).toLocaleString()}</div>
              </div>
              <Button variant="outline" onClick={() => setSelectedWallet(null)}>
                Back to list
              </Button>
            </div>
          </div>

          {loadingWalletDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 glass rounded-xl p-4 border border-border/50">
                <div className="text-sm font-semibold text-foreground mb-3">Recent Deposits</div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(selectedWallet.deposits || []).slice(0, 10).map((d: any) => (
                    <div key={d.id} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-foreground">KES {Number(d.amount || 0).toLocaleString()}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          String(d.status || '').toLowerCase() === 'success'
                            ? 'bg-green-500/20 text-green-500'
                            : String(d.status || '').toLowerCase() === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>{d.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{d.phone_number}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  {(selectedWallet.deposits || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No deposits</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass rounded-xl p-4 border border-border/50">
                <div className="text-sm font-semibold text-foreground mb-3">Recent Ledger</div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(selectedWallet.ledger || []).slice(0, 10).map((l: any) => (
                    <div key={l.id} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-foreground">KES {Number(l.amount || 0).toLocaleString()}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          String(l.entry_type || '').toLowerCase() === 'credit'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>{l.entry_type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{l.source || l.reference}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  {(selectedWallet.ledger || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No ledger entries</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass rounded-xl p-4 border border-border/50">
                <div className="text-sm font-semibold text-foreground mb-3">Withdrawal Requests</div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(selectedWallet.withdrawals || []).slice(0, 10).map((w: any) => (
                    <div key={w.id} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-foreground">KES {Number(w.amount || 0).toLocaleString()}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          String(w.status || '').toLowerCase() === 'paid'
                            ? 'bg-green-500/20 text-green-500'
                            : String(w.status || '').toLowerCase() === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : String(w.status || '').toLowerCase() === 'rejected'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}>{w.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{w.phone_number}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(w.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  {(selectedWallet.withdrawals || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No withdrawals</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {loadingWallets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Owner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{w.users?.full_name || "N/A"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{w.users?.company_name || "N/A"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{w.users?.email || "N/A"}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">KES {Number(w.balance || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => fetchWalletDetail(w.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {wallets.length === 0 && !loadingWallets && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No wallets found</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  const RevenueChart = () => {
    const data = analytics?.dailyRevenue || {};
    const chartData = Object.entries(data)
      .map(([date, revenue]) => ({ date, revenue: Number(revenue || 0) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formatAmount = (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-border/50"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground">Paid revenue over time</p>
          </div>
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
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>No revenue data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenueSuper" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAmount}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "12px"
                  }}
                  formatter={(value: number) => [`KES ${Number(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  fill="url(#colorRevenueSuper)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
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
              activity.type === "transaction" && (String(activity.status || '').toLowerCase() === 'success' || String(activity.status || '').toLowerCase() === 'paid' || String(activity.status || '').toLowerCase() === 'completed')
                ? "bg-green-500/20 text-green-500"
              : activity.type === "transaction"
              && String(activity.status || '').toLowerCase() === 'pending'
                ? "bg-yellow-500/20 text-yellow-500"
              : activity.type === "transaction"
                ? "bg-red-500/20 text-red-500"
              : activity.type === "till_created"
                ? "bg-blue-500/20 text-blue-500"
              : "bg-purple-500/20 text-purple-500"
            }`}>
              {activity.type === "transaction" ? (
                (String(activity.status || '').toLowerCase() === 'success' || String(activity.status || '').toLowerCase() === 'paid' || String(activity.status || '').toLowerCase() === 'completed')
                  ? <CheckCircle className="w-4 h-4" />
                  : String(activity.status || '').toLowerCase() === 'pending'
                  ? <Clock className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />
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
      {activities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">Activity will appear here as transactions, tills, and users are created</p>
        </div>
      )}
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
                <td className="py-3 px-4 text-foreground font-semibold">KES {Number(tx.amount || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-muted-foreground">{tx.phone_number}</td>
                <td className="py-3 px-4 text-foreground">{tx.tills?.name || "N/A"}</td>
                <td className="py-3 px-4 text-muted-foreground">{tx.users?.full_name || "N/A"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    (String(tx.status || '').toLowerCase() === 'success' || String(tx.status || '').toLowerCase() === 'paid' || String(tx.status || '').toLowerCase() === 'completed')
                      ? "bg-green-500/20 text-green-500"
                    : String(tx.status || '').toLowerCase() === 'pending'
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-red-500/20 text-red-500"
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
      {transactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions found</p>
          <p className="text-sm mt-1">Transactions will appear here once they are processed</p>
        </div>
      )}
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
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleOpenAdminRecipientsModal}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Withdrawal Alerts
                </Button>
                <Button
                  onClick={handleOpenEmailModal}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Onboarding Emails
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Super Admin Access</span>
                </div>
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
  { id: "wallets", label: "Wallets", icon: Users },
  { id: "withdrawals", label: "Withdrawals", icon: DollarSign },
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
                      {(analytics?.topTills || []).filter(t => (t.revenue || 0) > 0).slice(0, 5).map((till, i) => (
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
                              <p className="text-sm text-muted-foreground">
                                {till.users?.company_name || till.users?.full_name || till.users?.email || till.user_id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">KES {till.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                          </div>
                        </motion.div>
                      ))}
                      {(analytics?.topTills || []).filter(t => (t.revenue || 0) > 0).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No performing tills in this range yet
                        </div>
                      )}
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

              {activeTab === "wallets" && (
                <motion.div
                  key="wallets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <WalletsTable />
                </motion.div>
              )}

              {activeTab === "withdrawals" && (
                <motion.div
                  key="withdrawals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <WithdrawalRequestsTable />
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
                    {auditLogs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No audit logs found</p>
                        <p className="text-sm mt-1">Audit logs will appear here as admin actions are performed</p>
                      </div>
                    )}
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
                    {anomalies.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No anomalies detected</p>
                        <p className="text-sm mt-1">Click "Detect Anomalies" to scan for unusual patterns</p>
                      </div>
                    )}
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
                  {(!systemHealth || Object.keys(systemHealth.summary || {}).length === 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-6 border border-border/50"
                    >
                      <div className="text-center py-8 text-muted-foreground">
                        No system health metrics available yet
                      </div>
                    </motion.div>
                  )}

                  {(() => {
                    const entries = Object.entries(systemHealth?.summary || {});
                    const top3 = entries.slice(0, 3);
                    const icons = [Server, Database, Activity];
                    const colors = ["bg-green-500/20 text-green-500", "bg-blue-500/20 text-blue-500", "bg-purple-500/20 text-purple-500"];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {top3.map(([metricType, item], idx) => {
                          const Icon = icons[idx] || Activity;
                          const color = colors[idx] || "bg-secondary/30 text-foreground";

                          return (
                            <motion.div
                              key={metricType}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="glass rounded-2xl p-6 border border-border/50"
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground capitalize">{metricType.replace(/_/g, ' ')}</p>
                                  <p className="text-lg font-bold text-foreground">{item.status || 'Unknown'}</p>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {typeof item.current === 'number'
                                  ? `Current: ${item.current}${item.unit || ''}`
                                  : 'No data'}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}

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
                      {Object.entries(systemHealth?.summary || {}).slice(0, 4).map(([metricType, item]) => (
                        <div key={metricType} className="p-4 rounded-lg bg-secondary/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground capitalize">{metricType}</span>
                            <span className="text-lg font-bold text-foreground">
                              {typeof item.current === 'number' ? `${item.current}${item.unit || ''}` : 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Status: {item.status} {typeof item.trend === 'number' ? `• trend: ${item.trend.toFixed(1)}%` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Email Customization Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl border border-border/50 w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-2xl font-bold text-foreground">Customize Onboarding Email</h2>
                <p className="text-muted-foreground mt-1">Edit the email content before sending to users without tills</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Subject</label>
                    <Input
                      value={customEmailSubject}
                      onChange={(e) => setCustomEmailSubject(e.target.value)}
                      placeholder="Email subject line"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Body (HTML)</label>
                    <textarea
                      value={customEmailBody}
                      onChange={(e) => setCustomEmailBody(e.target.value)}
                      placeholder="Email HTML content"
                      className="w-full h-64 p-3 rounded-lg border border-border/50 bg-secondary/30 text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Available placeholders: {"{{full_name}}"}, {"{{dashboard_url}}"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
                    <div className="border border-border/50 rounded-lg p-4 bg-white">
                      <div dangerouslySetInnerHTML={{ __html: customEmailBody.replace(/{{full_name}}/g, 'John Doe').replace(/{{dashboard_url}}/g, window.location.origin) }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border/50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendOnboardingEmails}
                  disabled={sendingOnboardingEmails}
                >
                  {sendingOnboardingEmails ? "Sending..." : "Send Emails"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Notification Recipients Modal */}
      <AnimatePresence>
        {showAdminRecipientsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdminRecipientsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl border border-border/50 w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-2xl font-bold text-foreground">Withdrawal Alert Recipients</h2>
                <p className="text-muted-foreground mt-1">
                  Alerts go to all Super Admin accounts plus the extra emails you add here.
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                  <div className="text-sm font-medium text-foreground mb-1">Status</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {adminRecipientsEnabled ? "Enabled" : "Disabled"} (disabling stops withdrawal emails)
                  </div>
                  <Button
                    variant={adminRecipientsEnabled ? "outline" : "default"}
                    onClick={() => setAdminRecipientsEnabled((v) => !v)}
                    disabled={loadingAdminRecipients || savingAdminRecipients}
                  >
                    {adminRecipientsEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Super Admin emails</div>
                      <div className="text-sm text-muted-foreground">Automatically included</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{adminSuperAdminEmails.length}</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
                    {adminSuperAdminEmails.length === 0
                      ? "No super admin emails found"
                      : adminSuperAdminEmails.join(", ")}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Extra recipient emails</div>
                      <div className="text-sm text-muted-foreground">Up to 50</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{adminRecipientEmails.length}/50</div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={adminNewRecipientEmail}
                      onChange={(e) => setAdminNewRecipientEmail(e.target.value)}
                      placeholder="e.g. finance@company.com"
                      type="email"
                      disabled={loadingAdminRecipients || savingAdminRecipients}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAdminRecipientEmail}
                      disabled={loadingAdminRecipients || savingAdminRecipients}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {loadingAdminRecipients ? (
                      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : adminRecipientEmails.length === 0 ? (
                      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                        No extra emails added yet.
                      </div>
                    ) : (
                      adminRecipientEmails.map((email) => (
                        <div key={email} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                          <span className="text-sm text-foreground">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdminRecipientEmail(email)}
                            disabled={savingAdminRecipients || loadingAdminRecipients}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                  <div className="text-sm font-medium text-foreground mb-1">Total recipients (preview)</div>
                  <div className="text-sm text-muted-foreground">
                    {adminAllRecipients.length === 0 ? "None" : `${adminAllRecipients.length} recipients`}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/50 flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAdminRecipientsModal(false)}
                  disabled={savingAdminRecipients || testingAdminRecipients}
                >
                  Close
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={testAdminRecipients}
                    disabled={savingAdminRecipients || testingAdminRecipients || loadingAdminRecipients}
                  >
                    {testingAdminRecipients ? "Testing..." : "Send Test Email"}
                  </Button>
                  <Button
                    onClick={saveAdminRecipients}
                    disabled={savingAdminRecipients || loadingAdminRecipients}
                  >
                    {savingAdminRecipients ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
