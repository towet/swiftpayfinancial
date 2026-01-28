import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MiniAppBuilder } from "@/components/dashboard/MiniAppBuilder";
import { motion } from "framer-motion";

const DashboardMiniApps = () => {
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
              <h1 className="text-3xl font-bold tracking-tight">Mini-Apps</h1>
              <p className="text-muted-foreground">
                Create and manage your zero-code storefronts for social commerce.
              </p>
            </motion.div>
            <MiniAppBuilder />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardMiniApps;
