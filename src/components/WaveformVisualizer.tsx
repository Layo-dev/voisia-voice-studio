import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState } from "react";

export const WaveformVisualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const bars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    height: Math.random() * 60 + 20,
  }));

  return (
    <div className="glass-card rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audio Preview</h3>
          <p className="text-sm text-muted-foreground">Listen before you download</p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-1 h-20 justify-center">
        {bars.map((bar, index) => (
          <motion.div
            key={bar.id}
            className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
            style={{ height: `${bar.height}%` }}
            animate={
              isPlaying
                ? {
                    height: [`${bar.height}%`, `${Math.random() * 60 + 20}%`, `${bar.height}%`],
                  }
                : {}
            }
            transition={{
              duration: 0.5,
              repeat: isPlaying ? Infinity : 0,
              delay: index * 0.02,
            }}
          />
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0:00</span>
          <span>0:15</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: isPlaying ? "100%" : "0%" }}
            transition={{ duration: 15, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
};
