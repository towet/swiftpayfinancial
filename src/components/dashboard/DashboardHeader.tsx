import { motion } from "framer-motion";
import { Search, Bell, ChevronDown, LogOut, Settings, HelpCircle, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  title: string;
  breadcrumbs?: string[];
}

export function DashboardHeader({ title, breadcrumbs = [] }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const profileMenuItems = [
    {
      icon: User,
      label: "Profile",
      action: () => {
        toast({
          title: "Profile",
          description: "Profile page coming soon",
        });
        setShowProfile(false);
      },
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => {
        navigate("/dashboard/settings");
        setShowProfile(false);
      },
    },
    {
      icon: HelpCircle,
      label: "Help",
      action: () => {
        navigate("/developers/docs");
        setShowProfile(false);
      },
    },
    {
      icon: LogOut,
      label: "Logout",
      action: handleLogout,
      isDanger: true,
    },
  ];

  const notifications = [
    { id: 1, message: "New payment received: KES 5,000", time: "2 min ago" },
    { id: 2, message: "API key was used from new IP", time: "15 min ago" },
    { id: 3, message: "Weekly report is ready", time: "1 hour ago" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 glass-strong border-b border-border px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Title & Breadcrumbs */}
        <div>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <span className={index === breadcrumbs.length - 1 ? "text-foreground" : ""}>
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Right side - Search, Notifications, Profile */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 pl-9 bg-secondary border-border focus:border-primary/50"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg glass hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </button>

            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 w-80 glass-strong rounded-xl p-4 space-y-3"
              >
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-2 rounded-lg glass hover:bg-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                JD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </button>

            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-14 w-56 glass-strong rounded-xl p-2 space-y-1"
              >
                {profileMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      item.isDanger
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}