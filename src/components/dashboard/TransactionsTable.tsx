import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn, formatTimeInAppTz } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import axios from "axios";

const statusStyles = {
  success: "bg-safaricom/20 text-safaricom border-safaricom/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  phone_number: string;
  status: "success" | "pending" | "failed";
  created_at: string;
}

interface TransactionsTableProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TransactionsTable({ limit, showViewAll = true }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return formatTimeInAppTz(timestamp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        {showViewAll && (
          <a
            href="/dashboard/transactions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Reference
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Amount
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Phone
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((tx, index) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ backgroundColor: "hsl(145 63% 42% / 0.05)" }}
                className="border-b border-border/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-foreground group-hover:text-safaricom transition-colors">
                    {tx.reference}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-foreground group-hover:text-safaricom transition-colors">
                    {formatAmount(tx.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground font-mono text-sm">
                    {tx.phone_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                      statusStyles[tx.status]
                    )}
                  >
                    {tx.status}
                  </motion.span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(tx.created_at)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}