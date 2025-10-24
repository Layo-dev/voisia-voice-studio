import { Navigation } from "@/components/Navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, Crown, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuthContext();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch voiceover history
  const { data: voiceovers, isLoading: voiceoversLoading } = useQuery({
    queryKey: ["voiceovers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voiceovers")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isPro = profile?.plan === "pro";

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="min-h-screen pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsl(250_85%_65%/0.1)_0%,_transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {profile?.name || "there"}!
              </h1>
              <p className="text-muted-foreground">
                Manage your voiceovers and account settings
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-card border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Available</CardTitle>
                  <Sparkles className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.credits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {isPro ? "Pro Plan" : "Free Plan"}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Voiceovers</CardTitle>
                  <Mic className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{voiceovers?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Type</CardTitle>
                  <Crown className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{profile?.plan || "Free"}</div>
                  {!isPro && (
                    <Link to="/pricing">
                      <Button variant="link" className="p-0 h-auto text-xs text-primary">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Voiceovers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Voiceovers
                </CardTitle>
                <CardDescription>Your latest voice generations</CardDescription>
              </CardHeader>
              <CardContent>
                {voiceoversLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : voiceovers && voiceovers.length > 0 ? (
                  <div className="space-y-4">
                    {voiceovers.map((voiceover) => (
                      <div
                        key={voiceover.id}
                        className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {voiceover.text_input}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Voice: {voiceover.voice_id}</span>
                              {voiceover.duration_seconds && (
                                <span>Duration: {voiceover.duration_seconds}s</span>
                              )}
                              <span>
                                {new Date(voiceover.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {voiceover.audio_url && (
                            <audio controls className="h-8">
                              <source src={voiceover.audio_url} type="audio/mpeg" />
                            </audio>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      No voiceovers yet. Create your first one!
                    </p>
                    <Link to="/">
                      <Button variant="hero">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Voiceover
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
