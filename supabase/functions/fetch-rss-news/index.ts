import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

const RSS_SOURCES: Record<string, string> = {
  aa: "https://www.aa.com.tr/tr/rss/default?cat=guncel",
  trt: "https://www.trthaber.com/xml_mobile.php?kat=guncel",
  ntv: "https://www.ntv.com.tr/turkiye.rss",
};

const KEYWORDS = /\b(Fırat|Dicle|Euphrates|Tigris|baraj|su seviyesi|su kesintisi|taşkın|kuraklık|nehir|sulama|GAP|DSİ|hidroelektrik|reservoir|dam|drought|flood)\b/i;

function parseRssXml(xml: string, sourceName: string): RssItem[] {
  const items: RssItem[] = [];

  // Simple XML parsing without external deps
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
    if (KEYWORDS.test(text)) {
      items.push({ title, link, description, pubDate, source: sourceName });
    }
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const allItems: RssItem[] = [];
    const errors: string[] = [];

    const fetchPromises = Object.entries(RSS_SOURCES).map(async ([name, url]) => {
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
        const items = parseRssXml(text, name);
        allItems.push(...items);
      } catch (e) {
        errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    });

    await Promise.all(fetchPromises);

    // Sort by date descending
    allItems.sort((a, b) => {
      const da = new Date(a.pubDate).getTime() || 0;
      const db = new Date(b.pubDate).getTime() || 0;
      return db - da;
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: allItems.slice(0, 50),
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
