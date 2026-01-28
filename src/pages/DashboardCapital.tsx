import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Coins, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DashboardCapital = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Coins className="h-8 w-8 text-primary" />
                Float-Flow Capital
              </h1>
              <p className="text-muted-foreground">
                Get instant working capital based on your transaction history.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass p-6 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Your Float-Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">84</span>
                  <span className="text-muted-foreground mb-1">/ 100</span>
                </div>
                <Progress value={84} className="h-2" />
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Top 15% of merchants
                </p>
              </div>

              <div className="md:col-span-2 glass p-6 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase">Available Credit</h3>
                  <p className="text-4xl font-bold text-primary">KES 25,000.00</p>
                  <p className="text-sm text-muted-foreground">Based on your last 30 days of volume.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="gradient" size="lg">Request Instant Loan</Button>
                  <Button variant="outline" size="lg">View Terms</Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">
                Loans are disbursed instantly to your primary M-Pesa number. Repayments are automatically deducted as a small percentage of your future sales.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardCapital;
