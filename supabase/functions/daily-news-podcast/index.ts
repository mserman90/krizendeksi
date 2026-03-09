import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── RSS Sources ──────────────────────────────────────────────────
interface RssItem {
  title: string; link: string; description: string;
  pubDate: string; source: string; language: string;
}

const RSS_SOURCES = [
  { name: "aa-tr", url: "https://www.aa.com.tr/tr/rss/default?cat=guncel", language: "tr" },
  { name: "trt", url: "https://www.trthaber.com/xml_mobile.php?kat=guncel", language: "tr" },
  { name: "ntv", url: "https://www.ntv.com.tr/turkiye.rss", language: "tr" },
  { name: "bbc", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", language: "en" },
  { name: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", language: "en" },
  { name: "aa-en", url: "https://www.aa.com.tr/en/rss/default?cat=world", language: "en" },
  { name: "aljazeera-tr", url: "https://www.aljazeera.com.tr/xml/rss/all.xml", language: "tr" },
  { name: "dw-tr", url: "https://rss.dw.com/rdf/rss-tur-all", language: "tr" },
];

const KEYWORDS_TR = /\b(Fırat|Dicle|Euphrates|Tigris|baraj|su seviyesi|su kesintisi|taşkın|kuraklık|nehir|sulama|GAP|DSİ|hidroelektrik|reservoir|dam|drought|flood|Keban|Ilısu|Karakaya|Atatürk Barajı|Birecik|su|enerji|elektrik|akış|debi|havza|göl|gölet|kurak|sel|yağmur|yağış|irrigation|water|energy|river|basin)\b/i;
const KEYWORDS_EN = /\b(Euphrates|Tigris|transboundary water|dam|reservoir|drought|flood|water crisis|water security|Turkey water|Iraq water|Syria water|hydroelectric|irrigation|Keban|Ilisu|Karakaya|Ataturk Dam|Birecik|GAP project|water scarcity|river basin|water diplomacy|water conflict|Southeastern Anatolia|riparian)\b/i;

function parseRssXml(xml: string, sourceName: string, language: string): RssItem[] {
  const items: RssItem[] = [];
  const keywords = language === "tr" ? KEYWORDS_TR : KEYWORDS_EN;
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    const description = (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim();
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    if (!keywords.test(`${title} ${description}`)) continue;
    items.push({ title, link, description, pubDate, source: sourceName, language });
  }
  return items;
}

// Fetch news from news_articles table (populated by fetch-rss-news function)
async function fetchNewsFromDB(sb: ReturnType<typeof createClient>): Promise<{ items: RssItem[]; errors: string[] }> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data, error } = await sb
    .from("news_articles")
    .select("title, link, description, pub_date, source, language")
    .gte("fetched_at", yesterday.toISOString())
    .order("fetched_at", { ascending: false })
    .limit(50);
  
  if (error) {
    console.error("DB fetch error:", error);
    return { items: [], errors: [`db: ${error.message}`] };
  }
  
  const items: RssItem[] = (data || []).map(row => ({
    title: row.title,
    link: row.link,
    description: row.description || "",
    pubDate: row.pub_date || "",
    source: row.source,
    language: row.language || "tr",
  }));
  
  return { items, errors: [] };
}

// ── AI Summary ───────────────────────────────────────────────────
async function summarizeNews(items: RssItem[], apiKey: string): Promise<string> {
  const trItems = items.filter(it => it.language === "tr");
  const enItems = items.filter(it => it.language === "en");
  const fmt = (list: RssItem[]) => list.map((it, i) => `${i + 1}. [${it.source.toUpperCase()}] ${it.title}\n   ${it.description}`).join("\n\n");
  let newsText = "";
  if (trItems.length > 0) newsText += `## Türkçe Kaynaklar (${trItems.length} haber)\n\n${fmt(trItems)}\n\n`;
  if (enItems.length > 0) newsText += `## International Sources (${enItems.length} articles)\n\n${fmt(enItems)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `Sen Türkiye'nin sınıraşan su havzaları konusunda uzman bir OSINT analistisin. Tüm özeti Türkçe yaz. Bölümler: 1. Günün Özeti 2. Türk Medyası 3. Uluslararası Basın 4. Karşılaştırmalı Analiz 5. Stratejik Değerlendirme 6. Risk Sinyalleri. Markdown formatında, profesyonel dil kullan.` },
        { role: "user", content: `Bugünün haberleri (${new Date().toLocaleDateString("tr-TR")}):\n\n${newsText}` },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`AI Gateway error [${resp.status}]: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "Özet oluşturulamadı.";
}

// ── Email Builder ────────────────────────────────────────────────
function buildEmailHtml(summary: string, trCount: number, enCount: number, unsubscribeToken: string, siteUrl: string): string {
  const date = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
  const formatted = summary
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<h3 style="color:#1e293b;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="color:#1e293b;margin:20px 0 10px;font-size:18px">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="color:#1e293b;margin:24px 0 12px;font-size:22px">$1</h1>')
    .replace(/^- (.*$)/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  const unsubscribeUrl = `${siteUrl}/bulten?unsubscribe=${unsubscribeToken}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;padding:28px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">🌊 Günlük Su Havzası Bülteni</h1>
      <p style="margin:6px 0 0;opacity:0.8;font-size:13px">${date} — Sınıraşan Su OSINT İzleme</p>
      <p style="margin:4px 0 0;opacity:0.6;font-size:11px">🇹🇷 ${trCount} Türkçe · 🌍 ${enCount} İngilizce haber</p>
    </div>
    <div style="background:#fff;padding:28px;border-left:4px solid #3b82f6">
      <h2 style="margin:0 0 16px;font-size:16px;color:#64748b;text-transform:uppercase;letter-spacing:1px">🤖 AI Analiz Özeti</h2>
      <div style="font-size:14px;line-height:1.7;color:#334155">${formatted}</div>
    </div>
    <div style="background:#fff;padding:16px;text-align:center;margin-top:2px">
      <a href="${siteUrl}/bulten" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">🎙️ Podcast Olarak Dinle</a>
    </div>
    <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center">
      <p style="font-size:11px;color:#94a3b8;margin:0">Kriz Endeksi · Lovable AI</p>
      <p style="font-size:10px;color:#94a3b8;margin:8px 0 0"><a href="${unsubscribeUrl}" style="color:#94a3b8">Abonelikten çık</a></p>
    </div>
  </div>
</body></html>`;
}

// ── Main Handler ─────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const siteUrl = "https://krizendeksi.lovable.app";

    console.log("Step 1: Fetching RSS news...");
    const { items, errors } = await fetchAllNews();
    const trCount = items.filter(i => i.language === "tr").length;
    const enCount = items.filter(i => i.language === "en").length;
    console.log(`Fetched ${items.length} items (${trCount} TR, ${enCount} EN)`);

    let summary = "Bugün ilgili haber bulunamadı.";
    if (items.length > 0) {
      console.log("Step 2: Generating AI summary...");
      summary = await summarizeNews(items, LOVABLE_API_KEY);
    }

    // Save to DB
    console.log("Step 3: Saving summary...");
    const today = new Date().toISOString().split("T")[0];
    await sb.from("daily_summaries").upsert({
      summary_date: today, summary_text: summary,
      news_count: items.length, tr_count: trCount, en_count: enCount, rss_errors: errors,
    }, { onConflict: "summary_date" });

    // Send to subscribers
    let emailsSent = 0;
    if (RESEND_API_KEY && items.length > 0) {
      console.log("Step 4: Sending to subscribers...");
      const { data: subscribers } = await sb
        .from("email_subscribers")
        .select("email, unsubscribe_token")
        .eq("status", "active");

      if (subscribers && subscribers.length > 0) {
        // Send in batches of 10
        for (let i = 0; i < subscribers.length; i += 10) {
          const batch = subscribers.slice(i, i + 10);
          await Promise.allSettled(batch.map(async (sub) => {
            try {
              const html = buildEmailHtml(summary, trCount, enCount, sub.unsubscribe_token, siteUrl);
              const date = new Date().toLocaleDateString("tr-TR");
              const resp = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "Su Havzası Bülteni <onboarding@resend.dev>",
                  to: [sub.email],
                  subject: `🌊 Günlük Su Havzası Bülteni — ${date}`,
                  html,
                }),
              });
              if (resp.ok) emailsSent++;
              else console.error(`Email failed for ${sub.email}:`, await resp.text());
            } catch (e) { console.error(`Email error for ${sub.email}:`, e); }
          }));
        }
        console.log(`Sent ${emailsSent}/${subscribers.length} emails`);
      } else {
        console.log("No active subscribers");
      }
    }

    return new Response(JSON.stringify({
      success: true, summaryDate: today, newsCount: items.length,
      breakdown: { tr: trCount, en: enCount }, emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Daily news podcast error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
