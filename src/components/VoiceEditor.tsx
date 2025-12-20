import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Sparkles, Trash2, Save, Mic, Volume2, Clock, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const VOICES = [
  { value: "alloy", label: "Alloy", gender: "Female" },
  { value: "echo", label: "Echo", gender: "Male" },
  { value: "fable", label: "Fable", gender: "Male" },
  { value: "onyx", label: "Onyx", gender: "Male" },
  { value: "nova", label: "Nova", gender: "Female" },
  { value: "shimmer", label: "Shimmer", gender: "Female" },
];

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
];

const TONES = [
  { value: "normal", label: "Normal" },
  { value: "calm", label: "Calm" },
  { value: "energetic", label: "Energetic" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
];

interface VoiceEditorProps {
  maxCharacters: number;
  isPro: boolean;
}

export const VoiceEditor = ({ maxCharacters, isPro }: VoiceEditorProps) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [language, setLanguage] = useState("en-US");
  const [tone, setTone] = useState("normal");
  const [speed, setSpeed] = useState([1.0]);
  const [generatedAudio, setGeneratedAudio] = useState<{
    url: string;
    text: string;
    id: string;
  } | null>(null);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem("voiceover-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setText(parsed.text || "");
        setVoice(parsed.voice || "alloy");
        setLanguage(parsed.language || "en-US");
        setTone(parsed.tone || "normal");
        setSpeed(parsed.speed || [1.0]);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  // Fetch recent voiceovers
  const { data: recentVoiceovers } = useQuery({
    queryKey: ["voiceovers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voiceovers")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate voiceover mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("create-voiceover", {
        body: { 
          text, 
          voice,
          language: language,
          speed: speed[0],
        },
      });

      if (response.error) {
        console.error('Function error:', response.error);
        throw new Error(response.error.message || "Failed to generate voiceover");
      }

      // Check if response data contains an error
      if (response.data?.error) {
        console.error('Response data error:', response.data.error);
        console.error('Response details:', response.data.details);
        throw new Error(response.data.error);
      }

      // Ensure response.data exists and has the expected structure
      if (!response.data || !response.data.voiceover) {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Invalid response from server');
      }

      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedAudio({
        url: data.voiceover.audio_url,
        text: data.voiceover.text_input,
        id: data.voiceover.id,
      });
      queryClient.invalidateQueries({ queryKey: ["voiceovers"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Voiceover generated! ${data.creditsUsed} credits used.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleGenerate = () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }
    if (text.length > maxCharacters) {
      toast.error(`Text exceeds ${maxCharacters} character limit`);
      return;
    }
    generateMutation.mutate();
  };

  const handleClear = () => {
    setText("");
    setGeneratedAudio(null);
    localStorage.removeItem("voiceover-draft");
    toast.success("Cleared");
  };

  const handleSaveDraft = () => {
    localStorage.setItem("voiceover-draft", JSON.stringify({
      text, voice, language, tone, speed
    }));
    toast.success("Draft saved");
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement("a");
    link.href = generatedAudio.url;
    link.download = `voiceover-${Date.now()}.mp3`;
    link.click();
    toast.success("Download started");
  };

  const handleRegenerate = () => {
    generateMutation.mutate();
  };

  const handleLoadRecent = (voiceover: any) => {
    setText(voiceover.text_input);
    setVoice(voiceover.voice_id);
    setGeneratedAudio({
      url: voiceover.audio_url,
      text: voiceover.text_input,
      id: voiceover.id,
    });
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > maxCharacters;
  const characterPercentage = (characterCount / maxCharacters) * 100;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Voice Studio
        </CardTitle>
        <CardDescription>Transform your text into natural-sounding speech</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
          {/* LEFT PANEL - Text & Controls */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <div className="p-6 space-y-6 h-full">
              {/* Text Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste or type your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className={`min-h-[180px] resize-none bg-input/50 border-border/50 focus:border-primary/50 ${
                    isOverLimit ? "border-destructive focus:border-destructive" : ""
                  }`}
                />
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                    {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
                  </span>
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverLimit ? "bg-destructive" : characterPercentage > 80 ? "bg-yellow-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(characterPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Voice Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    Voice
                  </label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label} ({v.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Speed</span>
                    <span className="text-muted-foreground">{speed[0].toFixed(1)}x</span>
                  </label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="mt-3"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="hero"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !text.trim() || isOverLimit}
                  className="flex-1"
                >
                  {generateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Voice
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={handleClear} title="Clear">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSaveDraft} title="Save Draft">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT PANEL - Audio Preview */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="p-6 h-full bg-muted/20 space-y-6">
              <AnimatePresence mode="wait">
                {generatedAudio ? (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold">Generated Audio</h3>
                    <AudioPlayer
                      audioUrl={generatedAudio.url}
                      onDownload={handleDownload}
                      onRegenerate={handleRegenerate}
                    />
                    <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {generatedAudio.text}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-48 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Play className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground">Your voiceover will appear here</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Enter text and click Generate
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recent Voices */}
              {recentVoiceovers && recentVoiceovers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Recent Voices
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {recentVoiceovers.map((vo) => (
                      <button
                        key={vo.id}
                        onClick={() => handleLoadRecent(vo)}
                        className="w-full p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 transition-colors text-left group"
                      >
                        <p className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {vo.text_input}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{vo.voice_id}</span>
                          {vo.duration_seconds && <span>{vo.duration_seconds}s</span>}
                          <span>{new Date(vo.created_at!).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};
