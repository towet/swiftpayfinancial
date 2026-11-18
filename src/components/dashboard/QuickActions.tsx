import { motion } from "framer-motion";
import { Key, Wallet, FileText, Link, Zap, ShieldCheck, Coins, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    icon: Zap,
    label: "Request Payment",
    description: "Send STK push to customer",
    path: "/dashboard/accounts",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 group-hover:bg-yellow-400",
  },
  {
    icon: Link,
    label: "Create Payment Link",
    description: "Share a branded pay link",
    path: "/dashboard/payment-links",
    color: "text-blue-400",
    bg: "bg-blue-400/10 group-hover:bg-blue-400",
  },
  {
    icon: Coins,
    label: "Top Up Tokens",
    description: "Add payment credits",
    path: "/dashboard/tokens",
    color: "text-orange-400",
    bg: "bg-orange-400/10 group-hover:bg-orange-400",
  },
  {
    icon: ShieldCheck,
    label: "Verify Identity",
    description: "Complete KYC to unlock payments",
    path: "/dashboard/kyc",
    color: "text-green-400",
    bg: "bg-green-400/10 group-hover:bg-green-400",
  },
  {
    icon: Key,
    label: "Create API Key",
    description: "Connect your app",
    path: "/dashboard/api-keys",
    color: "text-primary",
    bg: "bg-primary/10 group-hover:bg-primary",
  },
  {
    icon: BookOpen,
    label: "API Docs",
    description: "Integration guides & SDKs",
    path: "/developers/docs",
    color: "text-purple-400",
    bg: "bg-purple-400/10 group-hover:bg-purple-400",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="space-y-3"
    >
      <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>

      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          onClick={() => navigate(action.path)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.07 }}
          whileHover={{ x: 3 }}
          className="w-full bg-card border border-border rounded-xl p-3.5 hover:border-primary/40 hover:shadow-[var(--shadow-lift)] transition-all duration-200 cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-colors ${action.bg}`}>
              <action.icon className={`h-4 w-4 transition-colors ${action.color} group-hover:text-white`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">{action.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
