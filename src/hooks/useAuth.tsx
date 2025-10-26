import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (currentSession: Session | null) => {
    try {
      const authUser = currentSession?.user;
      if (!authUser) return;
      const email = authUser.email ?? undefined;
      const name = (authUser.user_metadata?.name || authUser.user_metadata?.full_name) as string | undefined;
      if (!email && !name) return;
      // Update existing profile row created by trigger
      const updates: Record<string, unknown> = {};
      if (email) updates.email = email;
      if (name) updates.name = name;
      if (Object.keys(updates).length === 0) return;
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", authUser.id);
      if (error) {
        // Silently ignore; profile creation is handled by DB trigger
        console.warn("Profile sync failed:", error.message);
      }
    } catch (e) {
      console.warn("Profile sync threw:", e);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) syncProfile(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) syncProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success("Account created successfully!");
      return { data, error: null };
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success("Welcome back!");
      return { data, error: null };
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success("Signed out successfully");
      return { error: null };
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success("Password reset email sent!");
      return { error: null };
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.message("Redirecting to Google...");
      return { data, error: null };
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
  };
};
