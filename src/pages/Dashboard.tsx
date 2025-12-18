import { Navigation } from "@/components/Navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { VoiceEditor } from "@/components/VoiceEditor";

const Dashboard = () => {
  const { user } = useAuthContext();

  // Fetch user profile
  const { data: profile } = useQuery({
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

  const isPro = profile?.plan === "pro";
  const maxCharacters = isPro ? 5000 : 1000;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="min-h-screen pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsl(250_85%_65%/0.1)_0%,_transparent_50%)]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {profile?.name || "there"}!
              </h1>
              <p className="text-muted-foreground">
                Create professional voiceovers in seconds
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="glass-card border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Plan</CardTitle>
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

            {/* Voice Editor */}
            <VoiceEditor maxCharacters={maxCharacters} isPro={isPro} />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
