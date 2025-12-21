import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Receipt, 
  Key, 
  Wallet, 
  Code2, 
  BarChart3, 
  Bell, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Lightbulb
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/swiftlogosss-Photoroom.png";
import { SwiftPaySupport } from "@/components/ui/SwiftPaySupport";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Receipt, label: "Transactions", path: "/dashboard/transactions" },
  { icon: Key, label: "API Keys", path: "/dashboard/api-keys" },
  { icon: Wallet, label: "Accounts", path: "/dashboard/accounts" },
  { icon: Code2, label: "Integrations", path: "/dashboard/integrations" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Bell, label: "Webhooks", path: "/dashboard/webhooks" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const developerItems = [
  { icon: Lightbulb, label: "Developer Portal", path: "/developers" },
  { icon: FileText, label: "API Docs", path: "/developers/docs" },
  { icon: BookOpen, label: "Integration Guide", path: "/developers/guide" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("swiftpay_auth");
    navigate("/");
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col glass-strong border-r border-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 overflow-hidden rounded-lg">
            <img src={logo} alt="SwiftPay" className="h-full w-full object-contain scale-[1.8]" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold gradient-text"
            >
              SwiftPay
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {/* Dashboard Section */}
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "gradient-primary text-primary-foreground glow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        {!collapsed && (
          <div className="my-4 px-4">
            <div className="h-px bg-border" />
          </div>
        )}

        {/* Developer Section */}
        {!collapsed && (
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Developer</p>
          </div>
        )}
        {developerItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "gradient-primary text-primary-foreground glow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2">
        {/* Support */}
        <SwiftPaySupport collapsed={collapsed} />

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Log Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}