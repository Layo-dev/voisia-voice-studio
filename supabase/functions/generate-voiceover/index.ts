import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Input validation schema
    const inputSchema = z.object({
      text: z.string()
        .min(1, "Text cannot be empty")
        .max(10000, "Text exceeds maximum length")
        .trim(),
      voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'], {
        errorMap: () => ({ message: "Invalid voice selection" })
      }),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
    });

    const body = await req.json();
    const validationResult = inputSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voice, speed } = validationResult.data;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check character limits based on plan
    const maxChars = profile.plan === 'pro' ? 5000 : 1000;
    if (text.length > maxChars) {
      return new Response(
        JSON.stringify({ error: `Text exceeds ${maxChars} character limit for ${profile.plan} plan` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate credits needed (1 credit per 100 characters, minimum 1)
    const creditsNeeded = Math.max(1, Math.ceil(text.length / 100));
    
    if (profile.credits < creditsNeeded) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Need ${creditsNeeded}, have ${profile.credits}` }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI TTS API
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Generating voiceover with OpenAI TTS...');
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: profile.plan === 'pro' ? 'tts-1-hd' : 'tts-1',
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3',
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate audio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio data
    const audioBuffer = await openaiResponse.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    // Generate unique filename
    const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.mp3`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voiceovers')
      .upload(filename, audioData, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to store audio file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL (or signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from('voiceovers')
      .getPublicUrl(filename);

    // For private bucket, use signed URL instead (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('voiceovers')
      .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7 days

    const audioUrl = signedUrlData?.signedUrl || urlData.publicUrl;

    // Estimate duration (rough: 150 words per minute, 5 chars per word)
    const estimatedDuration = Math.ceil((text.length / 5) / 150 * 60);

    // Save voiceover record to database
    const { data: voiceover, error: voiceoverError } = await supabase
      .from('voiceovers')
      .insert({
        user_id: user.id,
        text_input: text,
        voice_id: voice,
        audio_url: audioUrl,
        duration_seconds: estimatedDuration,
      })
      .select()
      .single();

    if (voiceoverError) {
      console.error('Database insert error:', voiceoverError);
      // Clean up uploaded file
      await supabase.storage.from('voiceovers').remove([filename]);
      return new Response(
        JSON.stringify({ error: 'Failed to save voiceover record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - creditsNeeded })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Credits update error:', updateError);
      // Note: Audio is already generated and saved, so we log but don't fail
    }

    console.log('Voiceover generated successfully:', voiceover.id);

    return new Response(
      JSON.stringify({ 
        voiceover,
        creditsUsed: creditsNeeded,
        creditsRemaining: profile.credits - creditsNeeded,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-voiceover function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
