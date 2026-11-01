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
      {/* Poster-style navy band with orange & green ribbon edges */}
      <div className="container relative z-10 px-4">
        <div className="relative rounded-3xl bg-ink overflow-hidden shadow-[0_24px_60px_-24px_hsl(var(--ink)/0.5)]">
          {/* Ribbon accents along the top edge — solid, no gradients */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
          <div className="absolute top-1.5 inset-x-0 h-1 bg-accent" />

          {/* Subtle corner accents */}
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent/10" />

          <div className="relative px-6 py-12 md:px-12 md:py-16">
            <p className="text-center text-[11px] font-bold tracking-[0.3em] text-primary mb-10">
              SIMPLE. SMART. FOR YOU.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <p className="text-4xl md:text-5xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="text-white/70 font-medium group-hover:text-white transition-colors">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
