export interface Transaction {
  id: string;
  amount: number;
  phone: string;
  status: "success" | "pending" | "failed";
  reference: string;
  timestamp: string;
  accountName: string;
}

export interface ApiKey {
  id: string;
  name: string;
  publicKey: string;
  secretKey: string;
  environment: "sandbox" | "production";
  status: "active" | "inactive";
  createdAt: string;
  lastUsed: string;
}

export interface PaymentAccount {
  id: string;
  type: "till" | "paybill";
  name: string;
  number: string;
  status: "active" | "inactive";
  balance: number;
}

export interface ActivityLog {
  id: string;
  type: "transaction" | "api_key" | "webhook" | "login" | "settings";
  message: string;
  timestamp: string;
}

// Generate realistic mock transactions
export const generateTransactions = (count: number): Transaction[] => {
  const statuses: Transaction["status"][] = ["success", "success", "success", "success", "pending", "failed"];
  const names = ["John Kamau", "Mary Wanjiku", "Peter Ochieng", "Jane Muthoni", "David Kiprop", "Sarah Akinyi"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `TXN-${String(i + 1).padStart(6, "0")}`,
    amount: Math.floor(Math.random() * 50000) + 100,
    phone: `254${7 + Math.floor(Math.random() * 3)}${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    reference: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    accountName: names[Math.floor(Math.random() * names.length)],
  }));
};

export const transactions: Transaction[] = generateTransactions(50);

export const apiKeys: ApiKey[] = [
  {
    id: "key-1",
    name: "Production API",
    publicKey: "pk_live_xH7kL9mN2pQ4rS6t",
    secretKey: "sk_live_••••••••••••••••",
    environment: "production",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    lastUsed: "2024-12-11T14:32:00Z",
  },
  {
    id: "key-2",
    name: "Sandbox Testing",
    publicKey: "pk_test_aB3cD5eF7gH9iJ1k",
    secretKey: "sk_test_••••••••••••••••",
    environment: "sandbox",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    lastUsed: "2024-12-10T09:15:00Z",
  },
];

export const paymentAccounts: PaymentAccount[] = [
  {
    id: "acc-1",
    type: "till",
    name: "Main Store Till",
    number: "5847291",
    status: "active",
    balance: 245750,
  },
  {
    id: "acc-2",
    type: "paybill",
    name: "Online Payments",
    number: "247365",
    status: "active",
    balance: 892430,
  },
];

export const activityLogs: ActivityLog[] = [
  { id: "log-1", type: "transaction", message: "Payment received: KES 2,500 from 254712345678", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: "log-2", type: "api_key", message: "API key 'Production API' was used", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: "log-3", type: "webhook", message: "Webhook delivered to https://api.example.com/webhook", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "log-4", type: "transaction", message: "Payment received: KES 15,000 from 254723456789", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: "log-5", type: "login", message: "Successful login from Chrome on macOS", timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: "log-6", type: "settings", message: "Email notifications enabled", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];

// Chart data for analytics
export const revenueChartData = [
  { date: "Mon", revenue: 125000, transactions: 42 },
  { date: "Tue", revenue: 189000, transactions: 58 },
  { date: "Wed", revenue: 156000, transactions: 51 },
  { date: "Thu", revenue: 245000, transactions: 78 },
  { date: "Fri", revenue: 198000, transactions: 64 },
  { date: "Sat", revenue: 312000, transactions: 89 },
  { date: "Sun", revenue: 275000, transactions: 72 },
];

export const hourlyActivityData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  transactions: Math.floor(Math.random() * 50) + 5,
}));