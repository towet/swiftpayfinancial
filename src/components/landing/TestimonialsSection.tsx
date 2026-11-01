import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "SwiftPay transformed how we handle payments. Integration took 30 minutes and our customers love the seamless experience.",
    author: "Sarah Kimani",
    role: "CEO, TechBoda",
    avatar: "SK",
    tone: "bg-primary",
    rating: 5,
  },
  {
    quote: "The real-time dashboard and analytics helped us understand our business better. Revenue tracking has never been easier.",
    author: "James Ochieng",
    role: "Founder, QuickMart",
    avatar: "JO",
    tone: "bg-accent",
    rating: 5,
  },
  {
    quote: "Best developer experience I've encountered. The documentation is clear, and the sandbox testing saved us countless hours.",
    author: "Amina Hassan",
    role: "CTO, PayFlow",
    avatar: "AH",
    tone: "bg-ink",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6">
            <Quote className="h-4 w-4 text-accent" />
            <span className="text-sm text-accent font-semibold">Customer Stories</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trusted by
            <span className="text-accent"> 500+ Businesses</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers say about SwiftPay.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-card rounded-2xl p-6 space-y-4 border border-border shadow-[0_10px_30px_-16px_hsl(222_58%_14%/0.15)] hover:shadow-[0_20px_44px_-18px_hsl(222_58%_14%/0.25)] transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className={`w-12 h-12 rounded-full ${testimonial.tone} flex items-center justify-center text-white font-semibold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
