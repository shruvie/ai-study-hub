import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing content of type:', contentType);

    // Generate all outputs in parallel using the AI
    const systemPrompt = `You are an educational content analyzer. Given the following content, generate structured learning materials.

You must respond with a valid JSON object containing exactly these fields:
1. "mindmap": A Mermaid.js diagram string starting with "graph TD" that visualizes the key concepts and their relationships
2. "audioScript": A 2-3 paragraph summary suitable for text-to-speech narration (conversational, engaging tone)
3. "videoOutline": An array of 5-7 slide objects, each with "title" and "content" fields
4. "quiz": An array of exactly 5 quiz questions, each with "question", "options" (array of 4 strings), and "correctIndex" (0-3)
5. "flashcards": An array of 8-10 flashcard objects, each with "front" (question/term) and "back" (answer/definition)

Ensure the mindmap uses proper Mermaid.js syntax with unique node IDs.
Make quiz questions progressively harder.
Make flashcards cover key vocabulary and concepts.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this content and generate learning materials:\n\n${content.substring(0, 15000)}` }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;
    
    console.log('AI response received, parsing...');
    
    let parsed;
    try {
      parsed = JSON.parse(generatedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Successfully generated learning materials');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mindmap: parsed.mindmap || 'graph TD\n  A[Content] --> B[Analysis]\n  B --> C[Insights]',
          audioScript: parsed.audioScript || 'No audio script generated.',
          videoOutline: parsed.videoOutline || [],
          quiz: parsed.quiz || [],
          flashcards: parsed.flashcards || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
