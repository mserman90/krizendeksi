import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  { name: "reuters", url: "https://www.reutersagency.com/feed/?taxonomy=best-regions&post_type=best", language: "en" },
  { name: "bbc", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", language: "en" },
  { name: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", language: "en" },
  { name: "aa-en", url: "https://www.aa.com.tr/en/rss/default?cat=world", language: "en" },
  { name: "aljazeera-tr", url: "https://www.aljazeera.com.tr/xml/rss/all.xml", language: "tr" },
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
3. **Uluslararası Basın Öne Çıkanlar** — Reuters, BBC, Al Jazeera gibi kaynaklardan önemli haberler
4. **Karşılaştırmalı Analiz** — Türk ve uluslararası medya arasındaki bakış açısı farklılıkları
5. **Stratejik Değerlendirme** — haberlerin Türkiye'nin su güvenliği açısından anlamı
6. **Risk Sinyalleri** — varsa endişe verici gelişmeler

Profesyonel, nesnel ve analitik bir dil kullan.`;

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

// ── Email Builder ────────────────────────────────────────────────
function buildEmailHtml(summary: string, items: RssItem[], errors: string[]): string {
  const date = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });

  const formattedSummary = summary
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<h3 style="color:#1e293b;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="color:#1e293b;margin:20px 0 10px;font-size:18px">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="color:#1e293b;margin:24px 0 12px;font-size:22px">$1</h1>')
    .replace(/^- (.*$)/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  const trItems = items.filter(it => it.language === "tr");
  const enItems = items.filter(it => it.language === "en");

  const renderRows = (list: RssItem[]) => list.slice(0, 10).map(it => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px">
        <a href="${it.link}" style="color:#2563eb;text-decoration:none;font-weight:500">${it.title}</a>
        <div style="color:#94a3b8;font-size:11px;margin-top:2px">${it.source.toUpperCase()} · ${it.pubDate ? new Date(it.pubDate).toLocaleString("tr-TR") : ""}</div>
      </td>
    </tr>
  `).join("");

  const langFlag = (lang: string) => lang === "tr" ? "🇹🇷" : "🌍";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;padding:28px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">🌊 Günlük Su Havzası Bülteni</h1>
      <p style="margin:6px 0 0;opacity:0.8;font-size:13px">${date} — Çok Dilli Sınıraşan Su OSINT İzleme</p>
      <p style="margin:4px 0 0;opacity:0.6;font-size:11px">🇹🇷 ${trItems.length} Türkçe · 🌍 ${enItems.length} İngilizce haber</p>
    </div>

    <div style="background:#fff;padding:28px;border-left:4px solid #3b82f6">
      <h2 style="margin:0 0 16px;font-size:16px;color:#64748b;text-transform:uppercase;letter-spacing:1px">🤖 AI Analiz Özeti</h2>
      <div style="font-size:14px;line-height:1.7;color:#334155">${formattedSummary}</div>
    </div>

    ${trItems.length > 0 ? `
    <div style="background:#fff;padding:20px;margin-top:2px">
      <h2 style="margin:0 0 12px;font-size:15px;color:#64748b">🇹🇷 Türk Kaynakları (${trItems.length})</h2>
      <table style="width:100%;border-collapse:collapse">${renderRows(trItems)}</table>
    </div>` : ""}

    ${enItems.length > 0 ? `
    <div style="background:#fff;padding:20px;margin-top:2px">
      <h2 style="margin:0 0 12px;font-size:15px;color:#64748b">🌍 Uluslararası Kaynaklar (${enItems.length})</h2>
      <table style="width:100%;border-collapse:collapse">${renderRows(enItems)}</table>
    </div>` : ""}

    <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center">
      ${errors.length > 0 ? `<p style="font-size:11px;color:#ef4444;margin:0 0 8px">⚠️ Erişilemeyen: ${errors.join(", ")}</p>` : ""}
      <p style="font-size:11px;color:#94a3b8;margin:0">Kriz Endeksi · Lovable AI (Gemini 2.5 Flash)</p>
    </div>
  </div>
</body></html>`;
}

// ── Main Handler ─────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    let recipient = "serdarerman@gmail.com";
    try {
      const body = await req.json();
      if (body?.recipient) recipient = body.recipient;
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

    console.log("Step 3: Sending email...");
    const date = new Date().toLocaleDateString("tr-TR");
    const html = buildEmailHtml(summary, items, errors);

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Su Havzası Bülteni <onboarding@resend.dev>",
        to: [recipient],
        subject: `🌊 Günlük Su Havzası Bülteni — ${date} (${items.length} haber)`,
        html,
      }),
    });

    const emailData = await emailResp.json();
    if (!emailResp.ok) throw new Error(`Resend error [${emailResp.status}]: ${JSON.stringify(emailData)}`);

    console.log("Email sent:", emailData.id);

    return new Response(JSON.stringify({
      success: true, emailId: emailData.id, newsCount: items.length,
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
