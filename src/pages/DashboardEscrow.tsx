import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DashboardEscrow = () => {
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
                <ShieldCheckIcon className="h-8 w-8 text-primary" />
                Trust-Shield Escrow
              </h1>
              <p className="text-muted-foreground">
                Secure your transactions with SwiftPay Escrow. Funds are held until delivery is confirmed.
              </p>
            </motion.div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                Enable Escrow on any payment link. The buyer receives a release code which they share with you only after receiving their goods.
              </AlertDescription>
            </Alert>

            <div className="glass p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <ShieldCheckIcon className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">No Escrow Transactions Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start by creating a payment link with Escrow enabled or initiate an escrow payment from your dashboard.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardEscrow;
