import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Businesses" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 2, prefix: "KES ", suffix: "B+", label: "Processed" },
  { value: 100, prefix: "<", suffix: "ms", label: "Response Time" },
];

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Number(current.toFixed(1)));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return (
    <span ref={ref}>
      {prefix}{displayValue % 1 === 0 ? Math.floor(displayValue) : displayValue}{suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient with Safaricom green */}
      <div className="absolute inset-0 gradient-safaricom opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-safaricom/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-primary/10 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl p-8 md:p-12 border border-safaricom/20 glow-safaricom"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center group cursor-pointer"
              >
                <motion.p 
                  className="text-4xl md:text-5xl font-bold gradient-text-safaricom mb-2"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                >
                  <AnimatedNumber 
                    value={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix} 
                  />
                </motion.p>
                <p className="text-muted-foreground font-medium group-hover:text-safaricom transition-colors">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}