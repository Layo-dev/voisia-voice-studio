import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TTSFORFREE_API_URL = "https://api.ttsforfree.com/api";

// Voice mapping - TTSForFree full voice IDs (v1:... format required)
// These are popular English voices from TTSForFree
const VOICE_MAP: Record<string, string> = {
  "en-US-Standard-A": "v1:AvaMNeural:en-US", // Ava - Female US
  "en-US-Standard-B": "v1:AndrewMNeural:en-US", // Andrew - Male US
  "en-US-Standard-C": "v1:EmmaMNeural:en-US", // Emma - Female US
  "en-US-Standard-D": "v1:BrianMNeural:en-US", // Brian - Male US
  "en-US-Standard-E": "v1:JennyNeural:en-US", // Jenny - Female US
  "en-US-Standard-F": "v1:GuyNeural:en-US", // Guy - Male US
};

// Default voice ID from TTSForFree docs (Brian voice)
const DEFAULT_VOICE = "v1:YPj2X6j04RZcJdGzo-CC0GBpkJ985PD5X_VWU_nJkNzppGtbnxJL-dU_hglv";

async function pollForCompletion(jobId: number, apiKey: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${TTSFORFREE_API_URL}/tts/status/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });
    
    if (!response.ok) {
      console.error(`Poll status error: ${response.status}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    
    const result = await response.json();
    console.log(`Poll attempt ${i + 1}: Status = ${result.Status}`);
    
    if (result.Status === "SUCCESS") {
      return result.Data;
    } else if (result.Status === "ERROR") {
      throw new Error(result.Message || "TTS generation failed");
    }
    
    // Wait 2 seconds before polling again (docs recommend 5s, we use 2s)
    await new Promise(resolve => setTimeout(resolve, 2000));
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

    // Get user profile to check credits - need both id and credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Could not fetch user profile");
    }

    const profileId = profile?.id;
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

    // Map the voice to TTSForFree format - use default voice for now
    // The v1:... format requires fetching the exact voice ID from their API
    const ttsVoice = DEFAULT_VOICE;
    console.log(`Using voice: ${ttsVoice}`);

    // Create TTS job using the correct endpoint
    const ttsResponse = await fetch(`${TTSFORFREE_API_URL}/tts/createby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        Texts: text,
        Voice: ttsVoice,
        Pitch: 0,
        ConnectionId: "",
        CallbackUrl: "",
      }),
    });

    const responseText = await ttsResponse.text();
    console.log(`TTS API response status: ${ttsResponse.status}`);
    console.log(`TTS API response body: ${responseText}`);

    if (!ttsResponse.ok) {
      console.error("TTS API error:", responseText);
      throw new Error(`TTS API error: ${ttsResponse.status} - ${responseText}`);
    }

    let ttsResult;
    try {
      ttsResult = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid TTS API response: ${responseText}`);
    }
    
    console.log("TTS response parsed:", JSON.stringify(ttsResult));

    let audioFilename: string;

    if (ttsResult.Status === "SUCCESS") {
      // Cache hit - audio is immediately available
      audioFilename = ttsResult.Data;
    } else if (ttsResult.Status === "PENDING") {
      // Need to poll for completion
      audioFilename = await pollForCompletion(ttsResult.Id, apiKey);
    } else if (ttsResult.Data) {
      // Sometimes the API returns data without explicit SUCCESS status
      audioFilename = ttsResult.Data;
    } else {
      throw new Error(ttsResult.Message || "TTS generation failed");
    }

    // The API returns a full CDN URL, use it directly
    let audioUrl: string;
    if (audioFilename.startsWith('http')) {
      audioUrl = audioFilename;
    } else {
      audioUrl = `${TTSFORFREE_API_URL}/tts/StreamFile?filename=${audioFilename}`;
    }
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

    // Save voiceover record - use profile.id (not auth user.id) for foreign key
    const { data: voiceover, error: insertError } = await supabase
      .from('voiceovers')
      .insert({
        user_id: profileId, // Use profile.id as that's what the FK references
        text_input: text,
        voice_id: voice,
        audio_url: audioUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Voiceover insert error:", insertError);
      // Still return a successful response with the audio URL even if DB insert fails
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl,
          voiceover: {
            audio_url: audioUrl,
            text_input: text,
            voice_id: voice,
          },
          creditsUsed: creditsNeeded,
          creditsRemaining: newCredits,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
