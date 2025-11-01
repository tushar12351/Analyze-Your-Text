import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing text:", text.substring(0, 100) + "...");

    // AI Detection Analysis
    const aiDetectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI detection expert. Analyze the given text and determine if it's AI-generated or human-written. 
            Look for patterns like:
            - Overly formal or uniform sentence structure
            - Lack of personal anecdotes or emotions
            - Consistent vocabulary complexity
            - Perfect grammar without natural imperfections
            - Generic or template-like responses
            - Lack of unique voice or personality
            
            Respond with a JSON object containing:
            - ai_score: percentage (0-100) indicating likelihood of AI generation
            - human_score: percentage (0-100) indicating likelihood of human writing
            - reasoning: brief explanation of your analysis
            - ai_segments: array of text segments that appear AI-generated`,
          },
          {
            role: "user",
            content: `Analyze this text:\n\n${text}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiDetectionResponse.ok) {
      const errorText = await aiDetectionResponse.text();
      console.error("AI Detection API error:", aiDetectionResponse.status, errorText);
      throw new Error("AI detection analysis failed");
    }

    const aiData = await aiDetectionResponse.json();
    const aiAnalysis = JSON.parse(aiData.choices[0].message.content);

    console.log("AI Analysis:", aiAnalysis);

    // Plagiarism Detection Analysis
    const plagiarismResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a plagiarism detection expert. Analyze the given text for signs of plagiarism.
            Look for:
            - Common phrases or sentences that appear in well-known sources
            - Academic or formal language that might be copied
            - Inconsistent writing style suggesting multiple sources
            - Direct quotes without attribution
            
            Respond with a JSON object containing:
            - plagiarism_score: percentage (0-100) indicating likelihood of plagiarism
            - plagiarized_segments: array of text segments that appear plagiarized
            - reasoning: brief explanation`,
          },
          {
            role: "user",
            content: `Analyze this text for plagiarism:\n\n${text}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!plagiarismResponse.ok) {
      const errorText = await plagiarismResponse.text();
      console.error("Plagiarism API error:", plagiarismResponse.status, errorText);
      throw new Error("Plagiarism analysis failed");
    }

    const plagiarismData = await plagiarismResponse.json();
    const plagiarismAnalysis = JSON.parse(plagiarismData.choices[0].message.content);

    console.log("Plagiarism Analysis:", plagiarismAnalysis);

    // Create highlighted text
    const highlightedText = createHighlightedText(
      text,
      aiAnalysis.ai_segments || [],
      plagiarismAnalysis.plagiarized_segments || []
    );

    const result = {
      ai_score: Math.round(aiAnalysis.ai_score || 0),
      human_score: Math.round(aiAnalysis.human_score || 100 - (aiAnalysis.ai_score || 0)),
      plagiarism_score: Math.round(plagiarismAnalysis.plagiarism_score || 0),
      highlighted_text: highlightedText,
      ai_reasoning: aiAnalysis.reasoning,
      plagiarism_reasoning: plagiarismAnalysis.reasoning,
    };

    // Save to database
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        await supabase.from("analysis_history").insert({
          user_id: user.id,
          text_content: text,
          ai_score: result.ai_score,
          human_score: result.human_score,
          plagiarism_score: result.plagiarism_score,
          highlighted_text: highlightedText,
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-text function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function createHighlightedText(
  text: string,
  aiSegments: string[],
  plagiarismSegments: string[]
): Array<{ text: string; type: "ai" | "plagiarism" | "normal" }> {
  const segments: Array<{ text: string; type: "ai" | "plagiarism" | "normal" }> = [];
  let currentIndex = 0;

  const allSegments = [
    ...aiSegments.map((s) => ({ text: s, type: "ai" as const })),
    ...plagiarismSegments.map((s) => ({ text: s, type: "plagiarism" as const })),
  ];

  // Sort by position in text
  allSegments.sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));

  for (const segment of allSegments) {
    const segmentIndex = text.indexOf(segment.text, currentIndex);
    if (segmentIndex === -1) continue;

    // Add normal text before this segment
    if (segmentIndex > currentIndex) {
      segments.push({
        text: text.substring(currentIndex, segmentIndex),
        type: "normal",
      });
    }

    // Add the highlighted segment
    segments.push(segment);
    currentIndex = segmentIndex + segment.text.length;
  }

  // Add remaining normal text
  if (currentIndex < text.length) {
    segments.push({
      text: text.substring(currentIndex),
      type: "normal",
    });
  }

  return segments;
}