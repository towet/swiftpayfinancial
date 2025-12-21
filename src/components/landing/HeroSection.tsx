import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

const floatingCards = [
  { amount: "KES 25,000", status: "Success", delay: 0, type: "mpesa" },
  { amount: "KES 15,750", status: "Processing", delay: 0.5, type: "pending" },
  { amount: "KES 42,300", status: "Success", delay: 1, type: "mpesa" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Safaricom green orb */}
      <motion.div
        className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full bg-safaricom/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-safaricom-light/25 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20"
            >
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">99.9% Uptime Guarantee</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Modern Payment
              <br />
              <span className="gradient-text">Infrastructure</span>
              <br />
              for Africa
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-lg">
              Accept M-Pesa payments with enterprise-grade APIs. Build, scale, and grow your business with SwiftPay.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard">
                <Button variant="glow" size="xl">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="xl">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-8">
              {[
                { icon: Shield, label: "Bank-grade Security" },
                { icon: Zap, label: "<100ms Response" },
                { icon: TrendingUp, label: "KES 2B+ Processed" },
              ].map((badge, index) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <badge.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right content - Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard card with Safaricom accent */}
            <motion.div
              className="glass-strong rounded-2xl p-6 glow-safaricom border border-safaricom/20"
              whileHover={{ scale: 1.02, boxShadow: "0 0 60px -10px hsl(145 63% 42% / 0.7)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-8 h-8 rounded-full bg-safaricom/20 flex items-center justify-center"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Smartphone className="w-4 h-4 text-safaricom" />
                    </motion.div>
                    <h3 className="text-lg font-semibold">Today's Revenue</h3>
                  </div>
                  <motion.span 
                    className="text-sm text-safaricom font-semibold"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    +12.5%
                  </motion.span>
                </div>
                <p className="text-4xl font-bold gradient-text-safaricom">KES 1,247,500</p>
                <div className="h-32 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        background: i % 3 === 0 
                          ? 'linear-gradient(to top, hsl(145 63% 42%), hsl(145 63% 52%))' 
                          : 'linear-gradient(to top, hsl(239 84% 67%), hsl(217 91% 60%))'
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      whileHover={{ scaleY: 1.1 }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating transaction cards with Safaricom styling */}
            {floatingCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{ 
                  delay: 1 + card.delay,
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px -5px hsl(145 63% 42% / 0.6)" }}
                className={`absolute rounded-lg p-4 backdrop-blur-xl border ${
                  card.type === "mpesa" 
                    ? "bg-safaricom/10 border-safaricom/30 glow-safaricom" 
                    : "glass border-border/50"
                } ${
                  index === 0 ? "-top-8 -left-8" :
                  index === 1 ? "top-1/2 -right-12" :
                  "-bottom-8 -left-4"
                }`}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-3 h-3 rounded-full ${
                      card.status === "Success" ? "bg-safaricom" : "bg-warning"
                    }`}
                    animate={card.status === "Success" 
                      ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
                      : { opacity: [1, 0.4, 1] }
                    }
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div>
                    <p className={`font-semibold text-sm ${card.type === "mpesa" ? "text-safaricom-foreground" : ""}`}>
                      {card.amount}
                    </p>
                    <p className={`text-xs ${card.type === "mpesa" ? "text-safaricom-light" : "text-muted-foreground"}`}>
                      {card.status}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}