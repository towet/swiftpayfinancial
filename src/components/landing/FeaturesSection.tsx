import { motion } from "framer-motion";
import { useState } from "react";
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
  ArrowRight
} from "lucide-react";

// Import feature images
import instantPaymentsImg from "@/assets/features/instant-payments.webp";
import realtimeDashboardImg from "@/assets/features/realtime-dashboard.webp";
import easyIntegrationImg from "@/assets/features/easy-integration.webp";
import webhookSupportImg from "@/assets/features/webhook-support.webp";
import developerFriendlyImg from "@/assets/features/developer-friendly.webp";
import bankSecurityImg from "@/assets/features/bank-security.webp";
import support247Img from "@/assets/features/support-247.webp";
import detailedAnalyticsImg from "@/assets/features/detailed-analytics.webp";
import autoReconciliationImg from "@/assets/features/auto-reconciliation.webp";

const features = [
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Process M-Pesa STK push payments in under 3 seconds with real-time confirmation.",
    image: instantPaymentsImg,
    size: "large",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    description: "Monitor transactions, revenue, and performance metrics in a beautiful interface.",
    image: realtimeDashboardImg,
    size: "large",
  },
  {
    icon: Code2,
    title: "Easy Integration",
    description: "Simple REST APIs with SDKs for JavaScript, Python, PHP, and more.",
    image: easyIntegrationImg,
    size: "medium",
  },
  {
    icon: Webhook,
    title: "Webhook Support",
    description: "Get instant notifications for every transaction with reliable webhook delivery.",
    image: webhookSupportImg,
    size: "medium",
  },
  {
    icon: Terminal,
    title: "Developer Friendly",
    description: "Comprehensive documentation, sandbox testing, and responsive support.",
    image: developerFriendlyImg,
    size: "medium",
  },
  {
    icon: Shield,
    title: "Bank-grade Security",
    description: "PCI-DSS compliant infrastructure with end-to-end encryption.",
    image: bankSecurityImg,
    size: "large",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert support team available around the clock via chat, email, or phone.",
    image: support247Img,
    size: "medium",
  },
  {
    icon: PieChart,
    title: "Detailed Analytics",
    description: "Deep insights into payment trends, customer behavior, and business growth.",
    image: detailedAnalyticsImg,
    size: "medium",
  },
  {
    icon: RefreshCw,
    title: "Auto Reconciliation",
    description: "Automatic matching of transactions with your accounting system.",
    image: autoReconciliationImg,
    size: "medium",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLarge = feature.size === "large";
  
  return (
    <motion.div
      variants={itemVariants}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
        isLarge ? "md:col-span-2 md:row-span-1" : ""
      }`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          src={feature.image}
          alt={feature.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Gradient Overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
          animate={{ opacity: isHovered ? 0.95 : 0.85 }}
          transition={{ duration: 0.3 }}
        />
        {/* Safaricom glow on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-safaricom/20 via-transparent to-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 p-6 flex flex-col justify-end ${isLarge ? "min-h-[280px]" : "min-h-[220px]"}`}>
        {/* Icon */}
        <motion.div 
          className="inline-flex p-3 rounded-xl gradient-safaricom mb-4 w-fit"
          animate={{ 
            rotate: isHovered ? [0, -5, 5, 0] : 0,
            scale: isHovered ? 1.1 : 1 
          }}
          transition={{ duration: 0.4 }}
        >
          <feature.icon className="h-6 w-6 text-safaricom-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h3 
          className="text-xl md:text-2xl font-bold text-foreground mb-2"
          animate={{ x: isHovered ? 5 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="group-hover:text-safaricom transition-colors duration-300">
            {feature.title}
          </span>
        </motion.h3>

        {/* Description */}
        <motion.p 
          className="text-muted-foreground text-sm md:text-base leading-relaxed"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0.8 }}
        >
          {feature.description}
        </motion.p>

        {/* Learn More Link */}
        <motion.div
          className="flex items-center gap-2 mt-4 text-safaricom font-medium text-sm"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
          transition={{ duration: 0.3 }}
        >
          <span>Learn more</span>
          <ArrowRight className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Border glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-safaricom/0 pointer-events-none"
        animate={{ 
          borderColor: isHovered ? "hsl(var(--safaricom) / 0.5)" : "hsl(var(--safaricom) / 0)",
          boxShadow: isHovered ? "0 0 30px hsl(var(--safaricom) / 0.3), inset 0 0 20px hsl(var(--safaricom) / 0.1)" : "none"
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background" />
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-safaricom/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 4 }}
      />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-safaricom/30 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-safaricom animate-pulse" />
            <span className="text-sm text-safaricom font-medium">Powerful Features</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="gradient-text-safaricom"> Accept Payments</span>
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
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Row 1: 2 large cards */}
          <FeatureCard feature={features[0]} index={0} />
          <FeatureCard feature={features[1]} index={1} />
          
          {/* Row 2: 3 medium cards */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <FeatureCard feature={features[2]} index={2} />
          </motion.div>
          <motion.div variants={itemVariants} className="md:col-span-1">
            <FeatureCard feature={features[3]} index={3} />
          </motion.div>
          <motion.div variants={itemVariants} className="md:col-span-2">
            <FeatureCard feature={features[4]} index={4} />
          </motion.div>
          
          {/* Row 3: Security large + 2 medium */}
          <FeatureCard feature={features[5]} index={5} />
          <motion.div variants={itemVariants} className="md:col-span-1">
            <FeatureCard feature={features[6]} index={6} />
          </motion.div>
          <motion.div variants={itemVariants} className="md:col-span-1">
            <FeatureCard feature={features[7]} index={7} />
          </motion.div>
          
          {/* Row 4: Auto Reconciliation centered */}
          <motion.div variants={itemVariants} className="md:col-span-4">
            <motion.div
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              whileHover={{ scale: 1.01, y: -3 }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <motion.img
                  src={features[8].image}
                  alt={features[8].title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
                <div className="absolute inset-0 bg-gradient-to-br from-safaricom/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 flex items-center gap-8 min-h-[180px]">
                <motion.div 
                  className="p-4 rounded-2xl gradient-safaricom group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                  <RefreshCw className="h-8 w-8 text-safaricom-foreground" />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 group-hover:text-safaricom transition-colors">
                    {features[8].title}
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    {features[8].description}
                  </p>
                </div>

                <motion.div
                  className="hidden md:flex items-center gap-2 text-safaricom font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </div>

              {/* Border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-safaricom/40 group-hover:shadow-[0_0_30px_hsl(var(--safaricom)/0.2)] transition-all duration-300 pointer-events-none" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
