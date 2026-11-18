import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  prefix?: string;
  suffix?: string;
  className?: string;
  delay?: number;
  color?: 'green' | 'orange' | 'blue' | 'purple';
}

const colorMap = {
  green:  {
    accent:  'stat-accent-green',
    iconBg:  'bg-green-50 border border-green-200',
    iconClr: 'text-green-600',
    trendClr:'text-green-600',
    glow:    'hover:shadow-[0_4px_24px_hsl(150_100%_33%/0.15)]',
    chip:    'bg-green-50 text-green-700 border-green-200',
  },
  orange: {
    accent:  'stat-accent-orange',
    iconBg:  'bg-orange-50 border border-orange-200',
    iconClr: 'text-orange-600',
    trendClr:'text-orange-600',
    glow:    'hover:shadow-[0_4px_24px_hsl(36_97%_50%/0.15)]',
    chip:    'bg-orange-50 text-orange-700 border-orange-200',
  },
  blue: {
    accent:  'stat-accent-blue',
    iconBg:  'bg-blue-50 border border-blue-200',
    iconClr: 'text-blue-600',
    trendClr:'text-blue-600',
    glow:    'hover:shadow-[0_4px_24px_hsl(217_91%_60%/0.15)]',
    chip:    'bg-blue-50 text-blue-700 border-blue-200',
  },
  purple: {
    accent:  'stat-accent-purple',
    iconBg:  'bg-purple-50 border border-purple-200',
    iconClr: 'text-purple-600',
    trendClr:'text-purple-600',
    glow:    'hover:shadow-[0_4px_24px_hsl(263_70%_60%/0.15)]',
    chip:    'bg-purple-50 text-purple-700 border-purple-200',
  },
};

export function StatCard({
  title, value, icon: Icon, trend, prefix = "", suffix = "",
  className, delay = 0, color = 'green',
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numeric = typeof value === "number"
    ? value
    : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const c = colorMap[color];

  useEffect(() => {
    const steps = 60; const ms = 1800;
    const step = numeric / steps; let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= numeric) { setDisplayValue(numeric); clearInterval(t); }
      else setDisplayValue(Math.floor(cur));
    }, ms / steps);
    return () => clearInterval(t);
  }, [numeric]);

  const fmtd = typeof value === "string" && value.includes(",")
    ? displayValue.toLocaleString() : displayValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden group bg-card rounded-2xl border border-border",
        "transition-all duration-300 cursor-default",
        "shadow-[var(--shadow-card)]",
        c.accent, c.glow,
        className
      )}
    >
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shimmer-bg rounded-2xl" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Text */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {prefix && <span className="text-sm font-semibold text-muted-foreground mr-0.5">{prefix}</span>}
              {typeof fmtd === 'number' ? fmtd.toLocaleString() : fmtd}{suffix}
            </p>
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-semibold", trend.isPositive ? "text-green-600" : "text-red-500")}>
                <span className="text-sm">{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground font-normal">vs yesterday</span>
              </div>
            )}
          </div>

          {/* Icon bubble */}
          <motion.div
            className={cn("shrink-0 p-3 rounded-xl transition-all duration-300", c.iconBg,
              "group-hover:scale-110 group-hover:shadow-md")}
            whileHover={{ rotate: [-8, 8, 0] }}
            transition={{ duration: 0.35 }}
          >
            <Icon className={cn("h-6 w-6", c.iconClr)} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
