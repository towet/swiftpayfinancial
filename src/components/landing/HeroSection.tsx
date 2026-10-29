import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp, PlayCircle, CheckCircle2, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-kenyan.jpg";
import heroBg from "@/assets/hero-bg-light.jpg";

const trustBadges = [
  { icon: Shield, label: "Bank-grade Security" },
  { icon: Zap, label: "Instant Settlement" },
  { icon: TrendingUp, label: "KES 2B+ Processed" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-background">
      {/* Generated brand background — navy/orange/green ribbon on white */}
      <img
        src={heroBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[70%_85%] md:object-center"
      />
      {/* Veil keeps text contrast on narrow screens where the wave sits behind copy */}
      <div className="absolute inset-0 bg-white/55 md:bg-white/25 lg:bg-transparent lg:bg-gradient-to-r lg:from-white/80 lg:via-white/40 lg:to-transparent" />

      <div className="container relative z-10 px-4 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* ---- Left: story ---- */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/90 border border-border shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-sm font-semibold text-foreground/90">
                Built in Nairobi. Trusted across Kenya.
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Every Shilling,
              <br />
              <span className="text-primary">One Platform.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Accept M-Pesa, card and bank payments, hold funds safely in escrow,
              and unlock working capital — everything your business needs to get
              paid, grow, and move faster.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-1">
              <Link to="/dashboard">
                <Button variant="glow" size="xl" className="font-bold rounded-xl shadow-lg shadow-primary/25">
                  Start Accepting Payments
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pay">
                <Button variant="outline" size="xl" className="rounded-xl gap-2 bg-card/90">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  See a Live Payment
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-6 border-t border-border/80">
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.12 }}
                  className="flex items-center gap-2.5 text-muted-foreground"
                >
                  <badge.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ---- Right: real Kenya, real money ---- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-xl mt-4 lg:mt-0"
          >
            <motion.div
              className="relative rounded-[2rem] overflow-hidden bg-card border border-border/60 shadow-[var(--shadow-lift)] p-2"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <img
                src={heroImage}
                alt="Kenyan shop owner receiving a payment notification on her phone"
                className="w-full h-[380px] sm:h-[440px] md:h-[520px] object-cover rounded-[1.6rem]"
                width={1024}
                height={1280}
              />
            </motion.div>

            {/* Floating: payment received */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{
                opacity: { delay: 0.8, duration: 0.5 },
                x: { delay: 0.8, duration: 0.5 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="hidden sm:block absolute -left-4 md:-left-10 top-14 bg-card rounded-2xl px-4 py-3 border border-border shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">KES 12,500</p>
                  <p className="text-xs text-muted-foreground">Payment received · M-Pesa</p>
                </div>
              </div>
            </motion.div>

            {/* Floating: escrow released */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
              transition={{
                opacity: { delay: 1.05, duration: 0.5 },
                x: { delay: 1.05, duration: 0.5 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
              }}
              className="hidden sm:block absolute -right-3 md:-right-8 bottom-24 bg-card rounded-2xl px-4 py-3 border border-border shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Escrow released</p>
                  <p className="text-xs text-muted-foreground">Order #2841 · Both sides safe</p>
                </div>
              </div>
            </motion.div>

            {/* Floating: capital */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="hidden md:block absolute left-10 -bottom-4 bg-card rounded-2xl px-4 py-2.5 border border-border shadow-[var(--shadow-card)]"
            >
              <p className="text-xs text-muted-foreground">Working capital unlocked</p>
              <p className="text-sm font-bold text-safaricom">KES 150,000 offer</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
