import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  language: string;
}

const RSS_SOURCES: { name: string; url: string; language: string }[] = [
  // Turkish sources
  { name: "aa-tr", url: "https://www.aa.com.tr/tr/rss/default?cat=guncel", language: "tr" },
  { name: "trt", url: "https://www.trthaber.com/xml_mobile.php?kat=guncel", language: "tr" },
  { name: "ntv", url: "https://www.ntv.com.tr/turkiye.rss", language: "tr" },
  // International English sources
  { name: "reuters", url: "https://www.reutersagency.com/feed/?taxonomy=best-regions&post_type=best", language: "en" },
  { name: "bbc", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", language: "en" },
  { name: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", language: "en" },
  // Anadolu Agency English
  { name: "aa-en", url: "https://www.aa.com.tr/en/rss/default?cat=world", language: "en" },
  // Al Jazeera Turkish
  { name: "aljazeera-tr", url: "https://www.aljazeera.com.tr/xml/rss/all.xml", language: "tr" },
];

const KEYWORDS_TR = /\b(Fırat|Dicle|Euphrates|Tigris|baraj|su seviyesi|su kesintisi|taşkın|kuraklık|nehir|sulama|GAP|DSİ|hidroelektrik|reservoir|dam|drought|flood|Keban|Ilısu|Karakaya|Atatürk Barajı|Birecik|su|enerji|elektrik|akış|debi|havza|göl|gölet|kurak|sel|yağmur|yağış|irrigation|water|energy|river|basin)\b/i;

const KEYWORDS_EN = /\b(Euphrates|Tigris|transboundary water|dam|reservoir|drought|flood|water crisis|water security|Turkey water|Iraq water|Syria water|hydroelectric|irrigation|Keban|Ilisu|Karakaya|Ataturk Dam|Birecik|GAP project|water scarcity|river basin|water diplomacy|water conflict|Southeastern Anatolia|riparian)\b/i;

function getKeywordRegex(language: string): RegExp {
  return language === "tr" ? KEYWORDS_TR : KEYWORDS_EN;
}

function parseRssXml(xml: string, sourceName: string, language: string, applyFilter: boolean): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();

    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();

    const description = (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]*>/g, "").trim();

    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();

    const text = `${title} ${description}`;
    if (applyFilter && !getKeywordRegex(language).test(text)) {
      continue;
    }
    items.push({ title, link, description, pubDate, source: sourceName, language });
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let applyFilter = true;
    try {
      const body = await req.json();
      if (body?.filter === false) applyFilter = false;
    } catch { /* no body is fine */ }

    const allItems: RssItem[] = [];
    const errors: string[] = [];

    const fetchPromises = RSS_SOURCES.map(async ({ name, url, language }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FDOsintBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          errors.push(`${name}: HTTP ${resp.status}`);
          return;
        }

        const text = await resp.text();
        const items = parseRssXml(text, name, language, applyFilter);
        allItems.push(...items);
      } catch (e) {
        errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    });

    await Promise.all(fetchPromises);

    allItems.sort((a, b) => {
      const da = new Date(a.pubDate).getTime() || 0;
      const db = new Date(b.pubDate).getTime() || 0;
      return db - da;
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: allItems.slice(0, 80),
        total: allItems.length,
        errors: errors.length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('RSS fetch error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
