import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Banknote, ArrowRight, Smartphone, Landmark, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import heroPoster from "@/assets/hero-poster.jpg";

const featureChips = [
  { icon: Zap, label: "Instant", strong: "Settlement" },
  { icon: ShieldCheck, label: "Escrow", strong: "Protected" },
  { icon: Banknote, label: "Working", strong: "Capital" },
];

const worksWith = [
  { icon: Smartphone, label: "M-Pesa", tone: "text-accent" },
  { icon: CreditCard, label: "Visa · Mastercard", tone: "text-foreground" },
  { icon: Landmark, label: "Banks", tone: "text-primary" },
];

const bottomItems = [
  { icon: ArrowRight, title: "Get Paid", sub: "Instantly" },
  { icon: ShieldCheck, title: "Stay Safe", sub: "Escrow Secured" },
  { icon: Banknote, title: "Anytime,", sub: "Anywhere" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-background">
      {/* Poster background — Kenyan moment, navy wave with orange & green ribbons */}
      <img
        src={heroPoster}
        alt=""
        aria-hidden
        width={1536}
        height={864}
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] sm:object-center"
      />
      {/* Cream veil keeps the copy crisp on small screens */}
      <div className="absolute inset-0 bg-background/60 sm:bg-background/25 lg:bg-transparent" />

      <div className="container relative z-10 flex-1 flex flex-col justify-center px-4 pt-32 pb-44 sm:pb-40">
        <div className="max-w-2xl space-y-7">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground"
          >
            Turn Every
            <br />
            <span className="text-primary">Payment</span>{" "}
            <span className="text-accent">Into Growth</span>
            <br />
            In Seconds!
          </motion.h1>

          {/* Fast | Safe | Reliable divider */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center gap-3 font-display text-lg sm:text-xl font-bold text-foreground"
          >
            <span>Fast</span>
            <span className="h-5 w-px bg-border" aria-hidden />
            <span>Safe</span>
            <span className="h-5 w-px bg-border" aria-hidden />
            <span>Reliable</span>
          </motion.div>

          {/* Light-blue icon chips — poster style */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex gap-5 sm:gap-8"
          >
            {featureChips.map((chip) => (
              <div key={chip.label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-secondary shadow-sm ring-1 ring-border/60">
                  <chip.icon className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" strokeWidth={2.2} />
                </div>
                <p className="text-xs sm:text-sm leading-tight font-semibold text-foreground">
                  {chip.label}
                  <br />
                  <span className="text-muted-foreground">{chip.strong}</span>
                </p>
              </div>
            ))}
          </motion.div>

          {/* Works with */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="space-y-3"
          >
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.28em] text-muted-foreground">
              WORKS WITH
            </p>
            <div className="flex flex-wrap gap-3">
              {worksWith.map((w) => (
                <div
                  key={w.label}
                  className="flex items-center gap-2 rounded-lg bg-card px-3.5 py-2 shadow-sm ring-1 ring-border/70"
                >
                  <w.icon className={`h-4 w-4 ${w.tone}`} />
                  <span className={`text-sm font-extrabold ${w.tone}`}>{w.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Script accents — poster energy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="hidden lg:block absolute right-8 top-24 z-10 font-script text-3xl font-bold leading-tight text-accent text-right rotate-[-2deg]"
      >
        Same Hustle,
        <br />
        Bigger Opportunities
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.8 }}
        className="hidden md:block absolute right-10 sm:right-16 bottom-[16%] z-10 font-script text-3xl lg:text-4xl font-bold leading-tight text-card text-right rotate-[-3deg] drop-shadow-md"
      >
        Your <span className="text-primary">Money</span>
        <br />
        Has Value!
      </motion.p>

      {/* Bottom strip on the navy wave */}
      <div className="relative z-10 px-4 pb-7 sm:pb-9">
        <div className="container">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link to="/dashboard">
              <Button
                variant="glow"
                size="xl"
                className="font-bold rounded-xl shadow-lg shadow-primary/30"
              >
                Start Accepting Payments
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-card">
              {bottomItems.map((item) => (
                <div key={item.title} className="flex items-center gap-2.5">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={2.2} />
                  <p className="text-sm font-bold leading-tight">
                    {item.title}
                    <br />
                    <span className="font-medium text-card/85">{item.sub}</span>
                  </p>
                </div>
              ))}
            </div>

            <p className="ml-auto hidden lg:block text-[11px] font-bold tracking-[0.3em] text-card/90">
              SIMPLE. SMART. FOR YOU.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
