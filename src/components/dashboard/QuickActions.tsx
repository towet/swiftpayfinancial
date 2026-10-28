import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Key, Wallet, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    icon: Key,
    label: "Create API Key",
    description: "Generate a new API key",
    path: "/dashboard/api-keys",
  },
  {
    icon: Wallet,
    label: "Add Till Number",
    description: "Connect a new till",
    path: "/dashboard/accounts",
  },
  {
    icon: FileText,
    label: "View Documentation",
    description: "Read the API docs",
    path: "/developers/docs",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>

      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          onClick={() => handleActionClick(action.path)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="w-full glass rounded-xl p-4 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 cursor-pointer group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg gradient-primary group-hover:scale-110 transition-transform">
              <action.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}