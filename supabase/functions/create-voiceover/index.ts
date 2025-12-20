import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TTSFORFREE_API_URL = "https://api.ttsforfree.com/api/tts";

// Voice mapping - TTSForFree voice IDs
const VOICE_MAP: Record<string, string> = {
  "en-US-Standard-A": "en-US-AvaMultilingualNeural",
  "en-US-Standard-B": "en-US-AndrewMultilingualNeural",
  "en-US-Standard-C": "en-US-EmmaMultilingualNeural",
  "en-US-Standard-D": "en-US-BrianMultilingualNeural",
  "en-US-Standard-E": "en-US-JennyNeural",
  "en-US-Standard-F": "en-US-GuyNeural",
};

async function pollForCompletion(jobId: string, apiKey: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${TTSFORFREE_API_URL}/GetStatus?id=${jobId}`, {
      headers: { "x-api-key": apiKey },
    });
    
    const result = await response.json();
    console.log(`Poll attempt ${i + 1}: Status = ${result.Status}`);
    
    if (result.Status === "SUCCESS") {
      return result.Data;
    } else if (result.Status === "ERROR") {
      throw new Error(result.Message || "TTS generation failed");
    }
    
    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error("TTS generation timed out");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TTSFORFREE_API_KEY');
    if (!apiKey) {
      throw new Error("TTSFORFREE_API_KEY is not configured");
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Authentication required");
    }

    console.log(`User ${user.id} requesting voiceover`);

    // Parse the request body
    const { text, voice, language } = await req.json();
    
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required");
    }

    if (text.length > 5000) {
      throw new Error("Text exceeds maximum length of 5000 characters");
    }

    // Get user profile to check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Could not fetch user profile");
    }

    const credits = profile?.credits || 0;
    const charactersNeeded = text.length;
    
    // 1 credit = 100 characters
    const creditsNeeded = Math.ceil(charactersNeeded / 100);
    
    if (credits < creditsNeeded) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          creditsNeeded,
          creditsAvailable: credits
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Map the voice to TTSForFree format
    const ttsVoice = VOICE_MAP[voice] || "en-US-BrianMultilingualNeural";
    console.log(`Using voice: ${ttsVoice}`);

    // Create TTS job
    const ttsResponse = await fetch(`${TTSFORFREE_API_URL}/CreateJob`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        Texts: text,
        Voice: ttsVoice,
        Pitch: 0,
        ConnectionId: "",
        CallbackUrl: "",
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("TTS API error:", errorText);
      throw new Error(`TTS API error: ${ttsResponse.status}`);
    }

    const ttsResult = await ttsResponse.json();
    console.log("TTS response:", JSON.stringify(ttsResult));

    let audioFilename: string;

    if (ttsResult.Status === "SUCCESS") {
      // Cache hit - audio is immediately available
      audioFilename = ttsResult.Data;
    } else if (ttsResult.Status === "PENDING") {
      // Need to poll for completion
      audioFilename = await pollForCompletion(ttsResult.Id, apiKey);
    } else {
      throw new Error(ttsResult.Message || "TTS generation failed");
    }

    // Construct the audio URL
    const audioUrl = `${TTSFORFREE_API_URL}/StreamFile?filename=${audioFilename}`;
    console.log(`Audio URL: ${audioUrl}`);

    // Deduct credits from user
    const newCredits = credits - creditsNeeded;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('user_id', user.id);

    if (updateError) {
      console.error("Credit update error:", updateError);
      // Don't fail the request, just log the error
    }

    // Save voiceover record
    const { data: voiceover, error: insertError } = await supabase
      .from('voiceovers')
      .insert({
        user_id: user.id,
        text_input: text,
        voice_id: voice,
        audio_url: audioUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Voiceover insert error:", insertError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        voiceover,
        creditsUsed: creditsNeeded,
        creditsRemaining: newCredits,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error in create-voiceover:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
