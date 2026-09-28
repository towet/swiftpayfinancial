import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Code2, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const codeSnippet = `const swiftpay = require('swiftpay-sdk');

// Initialize with your API key
const client = swiftpay.init('YOUR_API_KEY');

// Initiate STK Push
const payment = await client.stkPush({
  phone: '254712345678',
  amount: 100,
  reference: 'ORDER-001'
});

// Handle response
if (payment.success) {
  console.log('Payment initiated:', payment.checkoutId);
}`;

const features = [
  { icon: Zap, text: "Lightning fast integration" },
  { icon: Shield, text: "Bank-grade security" },
  { icon: Clock, text: "Real-time notifications" },
];

export const DeveloperSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-safaricom/20 via-primary/20 to-safaricom/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              
              {/* Code window */}
              <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Window header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#161b22] border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-white/60 text-sm font-mono">payment.js</span>
                </div>
                
                {/* Code content */}
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                  <pre className="text-white/90">
                    <code>
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">swiftpay</span>{" "}
                      <span className="text-white">=</span>{" "}
                      <span className="text-yellow-300">require</span>
                      <span className="text-white">(</span>
                      <span className="text-safaricom">'swiftpay-sdk'</span>
                      <span className="text-white">);</span>
                      {"\n\n"}
                      <span className="text-gray-500">// Initialize with your API key</span>
                      {"\n"}
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">client</span>{" "}
                      <span className="text-white">=</span>{" "}
                      <span className="text-blue-300">swiftpay</span>
                      <span className="text-white">.</span>
                      <span className="text-yellow-300">init</span>
                      <span className="text-white">(</span>
                      <span className="text-safaricom">'YOUR_API_KEY'</span>
                      <span className="text-white">);</span>
                      {"\n\n"}
                      <span className="text-gray-500">// Initiate STK Push</span>
                      {"\n"}
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">payment</span>{" "}
                      <span className="text-white">=</span>{" "}
                      <span className="text-purple-400">await</span>{" "}
                      <span className="text-blue-300">client</span>
                      <span className="text-white">.</span>
                      <span className="text-yellow-300">stkPush</span>
                      <span className="text-white">({"{"}</span>
                      {"\n"}
                      {"  "}
                      <span className="text-blue-300">phone</span>
                      <span className="text-white">:</span>{" "}
                      <span className="text-safaricom">'254712345678'</span>
                      <span className="text-white">,</span>
                      {"\n"}
                      {"  "}
                      <span className="text-blue-300">amount</span>
                      <span className="text-white">:</span>{" "}
                      <span className="text-orange-400">100</span>
                      <span className="text-white">,</span>
                      {"\n"}
                      {"  "}
                      <span className="text-blue-300">reference</span>
                      <span className="text-white">:</span>{" "}
                      <span className="text-safaricom">'ORDER-001'</span>
                      {"\n"}
                      <span className="text-white">{"}"});</span>
                    </code>
                  </pre>
                </div>

                {/* Bottom status bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-safaricom animate-pulse" />
                    <span className="text-white/40 text-xs">Ready</span>
                  </div>
                  <span className="text-white/40 text-xs">JavaScript</span>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -top-4 -right-4 px-3 py-1.5 bg-safaricom/20 backdrop-blur-sm border border-safaricom/30 rounded-full"
              >
                <span className="text-safaricom text-xs font-medium">5 lines of code</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -left-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
              >
                <span className="text-white text-xs font-medium">Copy & paste ready</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
              >
                <Code2 className="w-4 h-4 text-safaricom" />
                <span className="text-white/80 text-sm font-medium">Developer Friendly</span>
              </motion.div>

              {/* Heading */}
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  <span className="text-white">Start Receiving</span>
                  <br />
                  <span className="bg-gradient-to-r from-safaricom via-emerald-400 to-safaricom bg-clip-text text-transparent">
                    Business Payments
                  </span>
                  <br />
                  <span className="text-white">Straight to M-Pesa</span>
                </h2>
                <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                  Integrate our SwiftPay API in minutes and start accepting M-Pesa payments instantly. 
                  No complex setup, no hidden fees – just seamless transactions.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:border-safaricom/30 group-hover:bg-safaricom/10 transition-all duration-300">
                      <feature.icon className="w-5 h-5 text-safaricom" />
                    </div>
                    <span className="text-white/80 font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">99.9%</p>
                  <p className="text-sm text-white/50">Uptime</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-safaricom">&lt;3s</p>
                  <p className="text-sm text-white/50">Response time</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">24/7</p>
                  <p className="text-sm text-white/50">Support</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-safaricom hover:bg-safaricom/90 text-white font-semibold px-6 group"
                >
                  View Documentation
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 font-semibold px-6"
                >
                  Get API Keys
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
