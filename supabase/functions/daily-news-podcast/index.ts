import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── RSS Sources (TR + International) ─────────────────────────────
interface RssSource { name: string; url: string; language: string; }

const RSS_SOURCES: RssSource[] = [
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

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  language: string;
}

// ── RSS Parser ───────────────────────────────────────────────────
function parseRssXml(xml: string, sourceName: string, language: string): RssItem[] {
  const items: RssItem[] = [];
  const keywords = language === "tr" ? KEYWORDS_TR : KEYWORDS_EN;
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    const description = (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim();
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    const text = `${title} ${description}`;
    if (!keywords.test(text)) continue;
    items.push({ title, link, description, pubDate, source: sourceName, language });
  }
  return items;
}

async function fetchAllNews(): Promise<{ items: RssItem[]; errors: string[] }> {
  const allItems: RssItem[] = [];
  const errors: string[] = [];

  await Promise.allSettled(
    RSS_SOURCES.map(async ({ name, url, language }) => {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10000);
      try {
        const resp = await fetch(url, {
          signal: ctrl.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FDOsintBot/1.0)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
        });
        clearTimeout(timeout);
        if (!resp.ok) { errors.push(`${name}: HTTP ${resp.status}`); return; }
        const text = await resp.text();
        allItems.push(...parseRssXml(text, name, language));
      } catch (e) {
        clearTimeout(timeout);
        errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    })
  );

  allItems.sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0));
  return { items: allItems.slice(0, 50), errors };
}

// ── AI Summarization ─────────────────────────────────────────────
async function summarizeNews(items: RssItem[], apiKey: string): Promise<string> {
  const trItems = items.filter(it => it.language === "tr");
  const enItems = items.filter(it => it.language === "en");

  const formatItems = (list: RssItem[]) => list.map((it, i) =>
    `${i + 1}. [${it.source.toUpperCase()}] ${it.title}\n   ${it.description}`
  ).join("\n\n");

  let newsText = "";
  if (trItems.length > 0) newsText += `## Türkçe Kaynaklar (${trItems.length} haber)\n\n${formatItems(trItems)}\n\n`;
  if (enItems.length > 0) newsText += `## International Sources (${enItems.length} articles)\n\n${formatItems(enItems)}`;

  const systemPrompt = `Sen Türkiye'nin sınıraşan su havzaları (Fırat, Dicle, Meriç, Çoruh, Aras, Kura) konusunda uzman bir OSINT analistisin.
Sana hem Türkçe hem İngilizce kaynaklardan toplanan günlük haber listesi veriliyor. Tüm özeti Türkçe olarak yaz. İngilizce haberleri Türkçeye çevirerek analiz et.

Özet şu bölümlerden oluşmalı:
1. **Günün Özeti** — 2-3 cümlelik genel değerlendirme
2. **Türk Medyası Öne Çıkanlar** — Türk kaynaklarından en önemli 3-5 haber
3. **Uluslararası Basın Öne Çıkanlar** — BBC, Al Jazeera gibi kaynaklardan önemli haberler
4. **Karşılaştırmalı Analiz** — Türk ve uluslararası medya arasındaki bakış açısı farklılıkları
5. **Stratejik Değerlendirme** — haberlerin Türkiye'nin su güvenliği açısından anlamı
6. **Risk Sinyalleri** — varsa endişe verici gelişmeler

Profesyonel, nesnel ve analitik bir dil kullan. Markdown formatında yaz.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `İşte bugünün haberleri (${new Date().toLocaleDateString("tr-TR")}):\n\n${newsText}` },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI Gateway error [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "Özet oluşturulamadı.";
}

// ── Main Handler ─────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let sendEmail = false;
    let recipient = "serdarerman@gmail.com";
    try {
      const body = await req.json();
      if (body?.recipient) recipient = body.recipient;
      if (body?.sendEmail) sendEmail = true;
    } catch { /* cron calls with no body */ }

    console.log("Step 1: Fetching RSS news (TR + EN)...");
    const { items, errors } = await fetchAllNews();
    const trCount = items.filter(i => i.language === "tr").length;
    const enCount = items.filter(i => i.language === "en").length;
    console.log(`Fetched ${items.length} items (${trCount} TR, ${enCount} EN, ${errors.length} errors)`);

    let summary = "Bugün ilgili haber bulunamadı.";
    if (items.length > 0) {
      console.log("Step 2: Generating multilingual AI summary...");
      summary = await summarizeNews(items, LOVABLE_API_KEY);
      console.log("AI summary generated successfully");
    }

    // Save summary to database
    console.log("Step 3: Saving summary to database...");
    const today = new Date().toISOString().split("T")[0];
    const { error: dbError } = await sb.from("daily_summaries").upsert({
      summary_date: today,
      summary_text: summary,
      news_count: items.length,
      tr_count: trCount,
      en_count: enCount,
      rss_errors: errors,
    }, { onConflict: "summary_date" });

    if (dbError) {
      console.error("DB save error:", dbError);
    } else {
      console.log("Summary saved to database for", today);
    }

    // Optionally send email
    if (sendEmail) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        console.log("Step 4: Sending email...");
        const date = new Date().toLocaleDateString("tr-TR");
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Su Havzası Bülteni <onboarding@resend.dev>",
            to: [recipient],
            subject: `🌊 Günlük Su Havzası Bülteni — ${date} (${items.length} haber)`,
            html: `<pre style="white-space:pre-wrap;font-family:sans-serif">${summary}</pre>`,
          }),
        });
        const emailData = await emailResp.json();
        if (!emailResp.ok) console.error("Email error:", emailData);
        else console.log("Email sent:", emailData.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      summaryDate: today,
      newsCount: items.length,
      breakdown: { tr: trCount, en: enCount },
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Daily news podcast error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
