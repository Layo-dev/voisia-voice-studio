import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Volume2 } from "lucide-react";

export const Hero = () => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Gradient Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_hsl(250_85%_65%/0.2)_0%,_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Heading */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Voice Generation</span>
            </motion.div>

            <h1 className="leading-tight">
              Make your writing sing with the{" "}
              <span className="gradient-text">magic of AI voiceovers</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your text into natural-sounding speech with our advanced AI voice technology. 
              Create studio-quality voiceovers in seconds.
            </p>
          </div>

          {/* Voice Generator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass-card rounded-2xl p-8 space-y-6 shadow-2xl"
          >
            <div className="space-y-4">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Enter your text
                </label>
                <Textarea
                  placeholder="Type or paste your text here to generate a voiceover..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px] resize-none bg-input/50 border-border/50 focus:border-primary/50 transition-colors"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{text.length} characters</span>
                  <span>Free: 1000 characters remaining</span>
                </div>
              </div>

              {/* Voice Selector */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Voice</label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Language</label>
                  <Select defaultValue="en-us">
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-us">English (US)</SelectItem>
                      <SelectItem value="en-gb">English (UK)</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex gap-3">
              <Button 
                variant="hero" 
                size="lg" 
                className="flex-1 text-base"
                disabled={!text.trim()}
              >
                <Sparkles className="w-5 h-5" />
                Generate Voice
              </Button>
              <Button variant="outline" size="lg">
                Preview
              </Button>
            </div>

            {/* Advanced Settings Toggle */}
            <button className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mx-auto">
              <span>Advanced settings</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button variant="outline" size="lg">
              View Demo
            </Button>
            <Button variant="ghost" size="lg">
              Learn More →
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </section>
  );
};
