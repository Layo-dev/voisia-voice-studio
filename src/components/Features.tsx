import { motion } from "framer-motion";
import { Zap, Globe, Wand2, Shield, Download, History } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate studio-quality voiceovers in seconds with our advanced AI engine.",
  },
  {
    icon: Globe,
    title: "30+ Languages",
    description: "Support for multiple languages and accents to reach a global audience.",
  },
  {
    icon: Wand2,
    title: "Natural Voices",
    description: "Ultra-realistic AI voices that sound like real human speech.",
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description: "Secure, scalable infrastructure built for businesses of all sizes.",
  },
  {
    icon: Download,
    title: "Easy Export",
    description: "Download your voiceovers in high-quality MP3 format instantly.",
  },
  {
    icon: History,
    title: "Voice History",
    description: "Access all your previous generations and manage your voice library.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Generative AI voices <span className="gradient-text">that perform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create the emotions of your story by harnessing the full spectrum of human expression.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
