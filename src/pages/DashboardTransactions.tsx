import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn, formatTimeInAppTz } from "@/lib/utils";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const statusFilters = ["All", "Success", "Pending", "Failed"];

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  phone_number: string;
  status: "success" | "pending" | "failed";
  created_at: string;
}

const statusStyles = {
  success: "bg-safaricom/20 text-safaricom border-safaricom/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function DashboardTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, activeFilter, searchQuery]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by status
    if (activeFilter !== "All") {
      filtered = filtered.filter(
        (tx) => tx.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.phone_number.includes(searchQuery) ||
          tx.amount.toString().includes(searchQuery)
      );
    }

    setFilteredTransactions(filtered);
  };

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

  const sumAmount = (txs: Transaction[]) => txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalsByStatus = {
    all: { count: transactions.length, amount: sumAmount(transactions) },
    success: {
      count: transactions.filter((t) => t.status === 'success').length,
      amount: sumAmount(transactions.filter((t) => t.status === 'success')),
    },
    pending: {
      count: transactions.filter((t) => t.status === 'pending').length,
      amount: sumAmount(transactions.filter((t) => t.status === 'pending')),
    },
    failed: {
      count: transactions.filter((t) => t.status === 'failed').length,
      amount: sumAmount(transactions.filter((t) => t.status === 'failed')),
    },
  };

  const currentTotals = {
    count: filteredTransactions.length,
    amount: sumAmount(filteredTransactions),
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Transactions" 
          breadcrumbs={["Dashboard", "Transactions"]} 
        />

        <div className="p-6 space-y-6">
          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      activeFilter === filter
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter === 'All'
                      ? `All (${totalsByStatus.all.count}) • ${formatAmount(totalsByStatus.all.amount)}`
                      : filter === 'Success'
                        ? `Success (${totalsByStatus.success.count}) • ${formatAmount(totalsByStatus.success.amount)}`
                        : filter === 'Pending'
                          ? `Pending (${totalsByStatus.pending.count}) • ${formatAmount(totalsByStatus.pending.amount)}`
                          : `Failed (${totalsByStatus.failed.count}) • ${formatAmount(totalsByStatus.failed.amount)}`}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="gradient">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Transactions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {activeFilter} Transactions ({currentTotals.count}) — {formatAmount(currentTotals.amount)}
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
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
                    {filteredTransactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-border/50 transition-colors cursor-pointer group hover:bg-secondary/50"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-foreground group-hover:text-primary transition-colors">
                            {tx.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}