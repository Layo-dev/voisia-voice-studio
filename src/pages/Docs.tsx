import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import { Book, Code, Zap, Shield } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-16">
              <h1 className="mb-6">
                <span className="gradient-text">Documentation</span> & API
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to integrate Voisia into your applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  icon: Book,
                  title: "Getting Started",
                  description: "Learn the basics and create your first voiceover",
                },
                {
                  icon: Code,
                  title: "API Reference",
                  description: "Complete API documentation with examples",
                },
                {
                  icon: Zap,
                  title: "Quickstart",
                  description: "Get up and running in under 5 minutes",
                },
                {
                  icon: Shield,
                  title: "Authentication",
                  description: "Secure your API requests and manage access",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="glass-card rounded-xl p-8 space-y-6">
              <h2 className="text-2xl font-bold">API Example</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Generate Voice</h3>
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">{`POST /api/v1/generate

{
  "text": "Hello, world!",
  "voice": "alloy",
  "language": "en-US"
}

Response:
{
  "id": "vo_123abc",
  "audioUrl": "https://...",
  "duration": 2.5,
  "charactersUsed": 13
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">{`curl -X POST https://api.voisia.com/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello!", "voice": "alloy"}'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Docs;
