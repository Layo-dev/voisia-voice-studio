import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out Voisia",
    features: [
      "1,000 characters per month",
      "6 voice options",
      "MP3 downloads",
      "Basic quality",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For serious content creators",
    features: [
      "50,000 characters per month",
      "30+ premium voices",
      "High-quality MP3 downloads",
      "Commercial license",
      "Priority support",
      "Voice history",
      "API access",
      "Advanced controls",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams and businesses",
    features: [
      "Unlimited characters",
      "Custom voice cloning",
      "Dedicated account manager",
      "SLA guarantee",
      "24/7 premium support",
      "Team collaboration",
      "Advanced analytics",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_hsl(250_85%_65%/0.15)_0%,_transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Simple, transparent pricing</span>
            </div>
            
            <h1 className="mb-6">
              Choose the <span className="gradient-text">perfect plan</span> for you
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you need more. All plans include access to our core features.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`glass-card rounded-2xl p-8 relative ${
                  plan.popular ? 'border-primary shadow-2xl shadow-primary/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold gradient-text">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>

                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-3 pt-6 border-t border-border/50">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-24 max-w-3xl mx-auto"
          >
            <h2 className="text-center mb-12">Frequently asked questions</h2>
            
            <div className="space-y-4">
              {[
                {
                  q: "Can I change plans later?",
                  a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
                },
                {
                  q: "What happens when I exceed my character limit?",
                  a: "You'll be notified when you're close to your limit. You can upgrade anytime or wait for your monthly reset.",
                },
                {
                  q: "Do you offer refunds?",
                  a: "We offer a 14-day money-back guarantee on all paid plans. No questions asked.",
                },
                {
                  q: "Can I use the generated voices commercially?",
                  a: "Pro and Enterprise plans include a commercial license. Free plan is for personal use only.",
                },
              ].map((faq, index) => (
                <div key={index} className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
