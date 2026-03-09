import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sb = createClient(supabaseUrl, supabaseKey);

    // Get articles without AI summary (limit batch to 10)
    const { data: articles, error: fetchErr } = await sb
      .from("news_articles")
      .select("id, title, description, language")
      .is("ai_summary", null)
      .order("fetched_at", { ascending: false })
      .limit(10);

    if (fetchErr) throw fetchErr;
    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No articles to process" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { id: string; success: boolean }[] = [];

    for (const article of articles) {
      try {
        const prompt = article.language === "tr"
          ? `Aşağıdaki haber başlığı ve açıklamasını analiz et. 
1) Tek cümlelik Türkçe özet yaz.
2) En fazla 4 adet Türkçe etiket belirle (su, enerji, diplomasi, güvenlik, çevre, iklim, tarım, ekonomi, siyaset, çatışma vb.).

Başlık: ${article.title}
Açıklama: ${article.description || "Yok"}`
          : `Analyze this news headline and description.
1) Write a one-sentence summary.
2) Provide up to 4 tags (water, energy, diplomacy, security, environment, climate, agriculture, economy, politics, conflict, etc.).

Title: ${article.title}
Description: ${article.description || "N/A"}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "You are a news analyst. Return ONLY valid JSON with exactly two fields: \"summary\" (string, one sentence) and \"tags\" (array of lowercase strings, max 4). No markdown, no explanation."
              },
              { role: "user", content: prompt }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "tag_article",
                  description: "Tag and summarize a news article",
                  parameters: {
                    type: "object",
                    properties: {
                      summary: { type: "string", description: "One sentence summary" },
                      tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Up to 4 lowercase tags"
                      }
                    },
                    required: ["summary", "tags"],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "tag_article" } }
          }),
        });

        if (response.status === 429) {
          console.warn("Rate limited, stopping batch");
          break;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for ${article.id}:`, response.status, errText);
          results.push({ id: article.id, success: false });
          continue;
        }

        const aiData = await response.json();
        
        let summary = "";
        let tags: string[] = [];

        // Extract from tool call response
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            summary = parsed.summary || "";
            tags = (parsed.tags || []).slice(0, 4);
          } catch {
            console.error("Failed to parse tool call args for", article.id);
            results.push({ id: article.id, success: false });
            continue;
          }
        } else {
          // Fallback: try parsing content directly
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            summary = parsed.summary || "";
            tags = (parsed.tags || []).slice(0, 4);
          } catch {
            summary = content.slice(0, 200);
            tags = [];
          }
        }

        const { error: updateErr } = await sb
          .from("news_articles")
          .update({ ai_summary: summary, ai_tags: tags })
          .eq("id", article.id);

        if (updateErr) {
          console.error("DB update error:", updateErr);
          results.push({ id: article.id, success: false });
        } else {
          results.push({ id: article.id, success: true });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error(`Error processing ${article.id}:`, e);
        results.push({ id: article.id, success: false });
      }
    }

    const processed = results.filter(r => r.success).length;
    return new Response(
      JSON.stringify({ success: true, processed, total: articles.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Summarize error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
