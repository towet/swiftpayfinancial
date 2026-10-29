import { motion } from "framer-motion";
import {
  Zap,
  BarChart3,
  Code2,
  Webhook,
  Terminal,
  Shield,
  Headphones,
  PieChart,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Process M-Pesa STK push payments in under 3 seconds with real-time confirmation.",
    size: "large",
    tone: "primary",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    description: "Monitor transactions, revenue, and performance metrics in a beautiful interface.",
    size: "large",
    tone: "accent",
  },
  {
    icon: Code2,
    title: "Easy Integration",
    description: "Simple REST APIs with SDKs for JavaScript, Python, PHP, and more.",
    size: "medium",
    tone: "primary",
  },
  {
    icon: Webhook,
    title: "Webhook Support",
    description: "Get instant notifications for every transaction with reliable webhook delivery.",
    size: "medium",
    tone: "accent",
  },
  {
    icon: Terminal,
    title: "Developer Friendly",
    description: "Comprehensive documentation, sandbox testing, and responsive support.",
    size: "medium",
    tone: "primary",
  },
  {
    icon: Shield,
    title: "Bank-grade Security",
    description: "PCI-DSS compliant infrastructure with end-to-end encryption.",
    size: "large",
    tone: "accent",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert support team available around the clock via chat, email, or phone.",
    size: "medium",
    tone: "primary",
  },
  {
    icon: PieChart,
    title: "Detailed Analytics",
    description: "Deep insights into payment trends, customer behavior, and business growth.",
    size: "medium",
    tone: "accent",
  },
  {
    icon: RefreshCw,
    title: "Auto Reconciliation",
    description: "Automatic matching of transactions with your accounting system.",
    size: "wide",
    tone: "primary",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const toneStyles: Record<string, { chip: string; title: string; hoverBorder: string }> = {
  primary: {
    chip: "bg-primary/10 text-primary",
    title: "group-hover:text-primary",
    hoverBorder: "hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_hsl(32_92%_52%/0.35)]",
  },
  accent: {
    chip: "bg-accent/10 text-accent",
    title: "group-hover:text-accent",
    hoverBorder: "hover:border-accent/40 hover:shadow-[0_12px_32px_-12px_hsl(145_58%_40%/0.35)]",
  },
};

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const tone = toneStyles[feature.tone];
  const isWide = feature.size === "wide";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`group relative bg-card border border-border rounded-2xl p-6 transition-all duration-300 cursor-default ${tone.hoverBorder} ${
        feature.size === "large" ? "md:col-span-2" : isWide ? "md:col-span-4" : ""
      }`}
    >
      <div className={`flex ${isWide ? "flex-row items-center gap-6" : "flex-col gap-4"} `}>
        <div className={`inline-flex p-3 rounded-xl ${tone.chip} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
          <feature.icon className="h-6 w-6" />
        </div>
        <div className={isWide ? "flex-1" : ""}>
          <h3 className={`text-xl font-bold text-foreground mb-1.5 transition-colors duration-300 ${tone.title}`}>
            {feature.title}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {feature.description}
          </p>
        </div>
        {isWide && (
          <div className="hidden md:flex items-center gap-2 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Learn more</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-white" />

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm text-accent font-semibold">Powerful Features</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-accent">Accept Payments</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern businesses. Built for scale, optimized for Africa.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
