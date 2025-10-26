import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export const WaveformVisualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isMobile = useIsMobile();
  const barCount = isMobile ? 20 : 40;

  const [bars, setBars] = useState(Array.from({ length: barCount }, (_, i) => ({
    id: i,
    height: Math.random() * 60 + 20,
  })));

  useEffect(() => {
    setBars(Array.from({ length: barCount }, (_, i) => ({
      id: i,
      height: Math.random() * 60 + 20,
    })));
  }, [barCount]);

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold">Audio Preview</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Listen before you download</p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 glow-primary min-h-[44px] min-w-[44px]"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-0.5 sm:gap-1 h-16 sm:h-20 justify-center">
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
