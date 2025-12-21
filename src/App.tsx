import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardTransactions from "./pages/DashboardTransactions";
import DashboardApiKeys from "./pages/DashboardApiKeys";
import DashboardAccounts from "./pages/DashboardAccounts";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardSettings from "./pages/DashboardSettings";
import DeveloperPortal from "./pages/DeveloperPortal";
import DeveloperDocs from "./pages/DeveloperDocs";
import DeveloperGuide from "./pages/DeveloperGuide";
import DashboardWebhooks from "./pages/DashboardWebhooks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

const AppContent = () => {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/developers" element={<DeveloperPortal />} />
        <Route path="/developers/docs" element={<DeveloperDocs />} />
        <Route path="/developers/guide" element={<DeveloperGuide />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/dashboard/transactions" element={<ProtectedRoute element={<DashboardTransactions />} />} />
        <Route path="/dashboard/api-keys" element={<ProtectedRoute element={<DashboardApiKeys />} />} />
        <Route path="/dashboard/accounts" element={<ProtectedRoute element={<DashboardAccounts />} />} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute element={<DashboardAnalytics />} />} />
        <Route path="/dashboard/integrations" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/dashboard/webhooks" element={<ProtectedRoute element={<DashboardWebhooks />} />} />
        <Route path="/dashboard/settings" element={<ProtectedRoute element={<DashboardSettings />} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
