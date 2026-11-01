import { motion } from "framer-motion";
import { useState } from "react";
import { UserPlus, Code, CheckCircle2, ArrowRight, Sparkles, Zap } from "lucide-react";
import stepSignupImg from "@/assets/steps/step-signup.webp";
import stepIntegrateImg from "@/assets/steps/step-integrate.webp";
import stepGetpaidImg from "@/assets/steps/step-getpaid.webp";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    image: stepSignupImg,
    title: "Sign Up",
    subtitle: "Create Account",
    description: "Create your free account in under 2 minutes. No credit card required.",
    tone: "primary",
    features: ["Free forever plan", "No credit card", "Instant access"],
  },
  {
    number: "02",
    icon: Code,
    title: "Integrate API",
    subtitle: "Add Code",
    description: "Add a few lines of code to start accepting payments.",
    tone: "accent",
    image: stepIntegrateImg,
    code: `const swiftpay = new SwiftPay({
  apiKey: 'your_api_key'
});

const payment = await swiftpay.stkPush({
  phone: '254712345678',
  amount: 1000,
  reference: 'ORDER-123'
});`,
    features: ["Simple SDK", "REST API", "Webhooks"],
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Get Paid",
    subtitle: "Start Earning",
    description: "Receive payments instantly to your M-Pesa account with real-time notifications.",
    tone: "primary",
    image: stepGetpaidImg,
    features: ["Instant settlement", "Real-time alerts", "Auto reconcile"],
  },
];

const toneStyles: Record<string, { chip: string; ring: string; title: string }> = {
  primary: {
    chip: "bg-primary text-white",
    ring: "ring-primary/60 shadow-[0_16px_40px_-16px_hsl(32_92%_52%/0.4)]",
    title: "group-active:text-primary",
  },
  accent: {
    chip: "bg-accent text-white",
    ring: "ring-accent/60 shadow-[0_16px_40px_-16px_hsl(145_58%_40%/0.4)]",
    title: "group-active:text-accent",
  },
};

function StepCard({ step, index, isActive, onClick }: { step: (typeof steps)[0]; index: number; isActive: boolean; onClick: () => void }) {
  const tone = toneStyles[step.tone];

  return (
    <motion.div
      className="relative cursor-pointer group"
      onClick={onClick}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -6 }}
    >
      <motion.div
        className={`relative overflow-hidden rounded-3xl bg-card border border-border p-6 md:p-8 min-h-[340px] flex flex-col transition-all duration-500 ${
          isActive ? `ring-2 ${tone.ring}` : "ring-1 ring-border/60"
        }`}
      >
        {/* Step Number Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white ${tone.chip}`}>
            {step.number}
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Step {index + 1}</p>
            <p className="text-sm font-semibold text-accent">{step.subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${tone.chip}`}>
            <step.icon className="h-5 w-5" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">{step.description}</p>

        {/* Code Block for step 2 */}
        {step.code && (
          <motion.div
            className="bg-secondary/60 rounded-xl p-4 mb-6 overflow-hidden border border-border/70"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: isActive ? 1 : 0.6, height: "auto" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">payment.js</span>
            </div>
            <pre className="text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">
              <code>{step.code}</code>
            </pre>
          </motion.div>
        )}

        {/* Features */}
        <div className="mt-auto">
          <div className="flex flex-wrap gap-2">
            {step.features.map((feature, i) => (
              <motion.span
                key={feature}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isActive ? 1 : 0.7, scale: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Active indicator line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>

      {/* Connector Arrow (not for last item) */}
      {index < 2 && (
        <motion.div
          className="hidden lg:flex absolute -right-8 top-1/2 -translate-y-1/2 z-20"
          animate={{ x: isActive ? [0, 8, 0] : 0, opacity: 1 }}
          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
        >
          <div className="w-14 h-14 rounded-full bg-card border border-border shadow-sm flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Soft ambient tint */}
      <div className="absolute inset-0 mesh-gradient" />

      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">Quick Setup</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Start Accepting Payments in{" "}
            <span className="text-primary">3 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From sign up to first payment in under 10 minutes.
          </p>

          {/* Progress Indicator */}
          <motion.div
            className="flex items-center justify-center gap-3 mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {steps.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveStep(index)}
                aria-label={`Show step ${index + 1}`}
                className={`relative h-2 rounded-full transition-all duration-300 ${
                  index === activeStep ? "w-12 bg-primary" : "w-8 bg-border hover:bg-primary/40"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {index === activeStep && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary"
                    layoutId="activeStep"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isActive={index === activeStep}
              onClick={() => setActiveStep(index)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border shadow-sm">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-foreground font-semibold">Average setup time:</span>
            <span className="text-primary font-bold">Under 10 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
