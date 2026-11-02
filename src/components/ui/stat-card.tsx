import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  prefix = "",
  suffix = "",
  className,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(value.replace(/[^0-9.]/g, "")) || 0;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  const formattedValue = typeof value === "string" && value.includes(",")
    ? displayValue.toLocaleString()
    : displayValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -3 }}
      className={cn(
        "bg-card border border-border rounded-xl p-6 group transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)] hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">
            {prefix}{formattedValue}{suffix}
          </p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-accent" : "text-destructive"
            )}>
              <motion.span
                animate={trend.isPositive ? { y: [0, -2, 0] } : { y: [0, 2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {trend.isPositive ? "↑" : "↓"}
              </motion.span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </div>
        <motion.div 
          className="p-3 rounded-lg bg-ink group-hover:bg-primary transition-colors duration-300"
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
        </motion.div>
      </div>
    </motion.div>
  );
}