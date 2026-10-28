import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp, PlayCircle, CheckCircle2, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-kenyan.jpg";

const trustBadges = [
  { icon: Shield, label: "Bank-grade Security" },
  { icon: Zap, label: "Instant Settlement" },
  { icon: TrendingUp, label: "KES 2B+ Processed" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Navy canvas with warm mesh */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      {/* Signature sweep — orange arc over green, echoing the brand ribbon */}
      <svg
        className="absolute -top-24 right-0 w-[80vw] max-w-[1100px] h-auto opacity-90 pointer-events-none hidden lg:block"
        viewBox="0 0 900 520"
        fill="none"
        aria-hidden
      >
        <path
          d="M900 40 C 640 20, 430 160, 460 340 C 480 470, 640 520, 900 500"
          stroke="hsl(146 62% 42% / 0.5)"
          strokeWidth="46"
          strokeLinecap="round"
        />
        <path
          d="M900 110 C 690 95, 520 210, 545 360 C 565 465, 700 505, 900 480"
          stroke="hsl(32 96% 56% / 0.75)"
          strokeWidth="56"
          strokeLinecap="round"
        />
      </svg>

      {/* Ambient orbs */}
      <motion.div
        className="absolute -left-40 top-1/3 w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="container relative z-10 px-4 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
          {/* ---- Left: story ---- */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <motion.div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border-accent/30"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-sm font-medium text-foreground/90">
                Built in Nairobi. Trusted across Kenya.
              </span>
            </motion.div>

            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.04] tracking-tight">
              Every Shilling,
              <br />
              <span className="gradient-text">One Platform.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Accept M-Pesa, card and bank payments, hold funds safely in escrow,
              and unlock working capital — everything your business needs to get
              paid, grow, and move faster.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-1">
              <Link to="/dashboard">
                <Button variant="glow" size="xl" className="font-bold rounded-xl">
                  Start Accepting Payments
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pay">
                <Button variant="glass" size="xl" className="rounded-xl gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  See a Live Payment
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-6 border-t border-border/60">
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
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-xl"
          >
            {/* Green backing card — poster-inspired layered panels */}
            <div className="absolute -top-4 -right-4 bottom-16 left-10 rounded-[2rem] bg-accent/25 rotate-2" />
            <div className="absolute -top-2 -right-2 bottom-14 left-8 rounded-[2rem] border border-primary/40 rotate-1" />

            <motion.div
              className="relative rounded-[2rem] overflow-hidden glass-strong p-2 shadow-2xl shadow-black/50"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <img
                src={heroImage}
                alt="Kenyan shop owner receiving a payment notification on her phone"
                className="w-full h-[420px] md:h-[520px] object-cover rounded-[1.6rem]"
                width={1024}
                height={1280}
              />
              {/* Warm bottom blend into the navy canvas */}
              <div className="absolute inset-0 rounded-[1.6rem] bg-gradient-to-t from-background/85 via-transparent to-transparent" />
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
              className="absolute -left-4 md:-left-10 top-16 glass-strong rounded-2xl px-4 py-3 border border-accent/30 glow-accent"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
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
              className="absolute -right-3 md:-right-8 bottom-28 glass-strong rounded-2xl px-4 py-3 border border-primary/30 glow-sm"
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
              className="absolute left-10 -bottom-4 glass-strong rounded-2xl px-4 py-2.5 border border-border/60"
            >
              <p className="text-xs text-muted-foreground">Working capital unlocked</p>
              <p className="text-sm font-bold gradient-text-safaricom">KES 150,000 offer</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
