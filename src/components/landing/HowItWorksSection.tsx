import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { UserPlus, Code, CheckCircle2, ArrowRight, Sparkles, Zap } from "lucide-react";

// Import step images
import stepSignupImg from "@/assets/steps/step-signup.webp";
import stepIntegrateImg from "@/assets/steps/step-integrate.webp";
import stepGetpaidImg from "@/assets/steps/step-getpaid.webp";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up",
    subtitle: "Create Account",
    description: "Create your free account in under 2 minutes. No credit card required.",
    image: stepSignupImg,
    color: "primary",
    features: ["Free forever plan", "No credit card", "Instant access"],
  },
  {
    number: "02",
    icon: Code,
    title: "Integrate API",
    subtitle: "Add Code",
    description: "Add a few lines of code to start accepting payments.",
    image: stepIntegrateImg,
    color: "safaricom",
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
    image: stepGetpaidImg,
    color: "success",
    features: ["Instant settlement", "Real-time alerts", "Auto reconcile"],
  },
];

interface StepCardProps {
  step: typeof steps[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function StepCard({ step, index, isActive, onClick }: StepCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      {/* Card Container */}
      <motion.div
        className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${
          isActive 
            ? "ring-2 ring-safaricom shadow-[0_0_40px_hsl(var(--safaricom)/0.3)]" 
            : "ring-1 ring-border/50"
        }`}
        animate={{ 
          scale: isActive ? 1.02 : 1,
          y: isHovered ? -8 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <motion.img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered || isActive ? 1.1 : 1 }}
            transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-safaricom/20 via-transparent to-primary/10"
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 min-h-[380px] flex flex-col">
          {/* Step Number Badge */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            animate={{ x: isActive ? 5 : 0 }}
          >
            <motion.div 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                isActive 
                  ? "gradient-safaricom text-safaricom-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}
              animate={{ rotate: isActive ? [0, -5, 5, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              {step.number}
            </motion.div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Step {index + 1}</p>
              <p className="text-sm font-medium text-safaricom">{step.subtitle}</p>
            </div>
            <motion.div
              className="p-2 rounded-xl gradient-safaricom"
              animate={{ 
                scale: isActive ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
            >
              <step.icon className="h-5 w-5 text-safaricom-foreground" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h3 
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
            animate={{ color: isActive ? "hsl(var(--safaricom))" : "hsl(var(--foreground))" }}
          >
            {step.title}
          </motion.h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Code Block for step 2 */}
          {step.code && (
            <motion.div
              className="glass rounded-xl p-4 mb-6 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: isActive ? 1 : 0.6, 
                height: "auto",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">payment.js</span>
              </div>
              <pre className="text-xs font-mono text-safaricom/80 overflow-x-auto leading-relaxed">
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
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-safaricom/10 text-safaricom border border-safaricom/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isActive ? 1 : 0.6, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Active indicator line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-safaricom via-primary to-safaricom"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>

      {/* Connector Arrow (not for last item) */}
      {index < 2 && (
        <motion.div 
          className="hidden lg:flex absolute -right-8 top-1/2 -translate-y-1/2 z-20"
          animate={{ 
            x: isActive ? [0, 8, 0] : 0,
            opacity: 1 
          }}
          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
        >
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-safaricom" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/20 via-background to-background" />
      <motion.div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-safaricom/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, delay: 7 }}
      />

      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-safaricom/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-safaricom" />
            <span className="text-sm text-safaricom font-medium">Quick Setup</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Start Accepting Payments in
            <span className="gradient-text-safaricom"> 3 Simple Steps</span>
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
                className={`relative h-2 rounded-full transition-all duration-300 ${
                  index === activeStep 
                    ? "w-12 bg-safaricom" 
                    : "w-8 bg-muted hover:bg-safaricom/40"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {index === activeStep && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-safaricom"
                    layoutId="activeStep"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-12">
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
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-safaricom/30"
            whileHover={{ scale: 1.05, borderColor: "hsl(var(--safaricom) / 0.6)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-5 h-5 text-safaricom" />
            <span className="text-foreground font-medium">Average setup time:</span>
            <span className="text-safaricom font-bold">Under 10 minutes</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
