import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Newspaper, ChevronLeft, ChevronRight, Archive, CalendarDays, Search, X, Sparkles, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

type LangFilter = "all" | "tr" | "en";
type DateRange = "7" | "30" | "all";

interface ArchivedArticle {
  id: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: string | null;
  source: string;
  language: string | null;
  fetched_at: string;
  ai_summary: string | null;
  ai_tags: string[] | null;
}

const PAGE_SIZE = 20;

const TAG_COLORS: Record<string, string> = {
  su: "bg-blue-500/20 text-blue-300",
  water: "bg-blue-500/20 text-blue-300",
  enerji: "bg-yellow-500/20 text-yellow-300",
  energy: "bg-yellow-500/20 text-yellow-300",
  diplomasi: "bg-purple-500/20 text-purple-300",
  diplomacy: "bg-purple-500/20 text-purple-300",
  güvenlik: "bg-red-500/20 text-red-300",
  security: "bg-red-500/20 text-red-300",
  çevre: "bg-green-500/20 text-green-300",
  environment: "bg-green-500/20 text-green-300",
  iklim: "bg-cyan-500/20 text-cyan-300",
  climate: "bg-cyan-500/20 text-cyan-300",
  tarım: "bg-emerald-500/20 text-emerald-300",
  agriculture: "bg-emerald-500/20 text-emerald-300",
  ekonomi: "bg-amber-500/20 text-amber-300",
  economy: "bg-amber-500/20 text-amber-300",
  siyaset: "bg-indigo-500/20 text-indigo-300",
  politics: "bg-indigo-500/20 text-indigo-300",
  çatışma: "bg-orange-500/20 text-orange-300",
  conflict: "bg-orange-500/20 text-orange-300",
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || "bg-muted text-muted-foreground";
}

const NewsArchive = () => {
  const [articles, setArticles] = useState<ArchivedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("news_articles")
        .select("*", { count: "exact" })
        .order("fetched_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (langFilter !== "all") {
        query = query.eq("language", langFilter);
      }

      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const since = new Date();
        since.setDate(since.getDate() - days);
        query = query.gte("fetched_at", since.toISOString());
      }

      if (debouncedQuery) {
        query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
      }

      if (tagFilter) {
        query = query.contains("ai_tags", [tagFilter]);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setArticles((data as ArchivedArticle[]) ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      console.error("Archive fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, langFilter, dateRange, debouncedQuery, tagFilter]);

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-news");
      if (error) throw error;

      if (data?.processed > 0) {
        toast.success(`${data.processed} haber AI ile özetlendi ve etiketlendi`);
        fetchArticles();
      } else {
        toast.info("Özetlenecek yeni haber bulunamadı");
      }
    } catch (e) {
      console.error("Summarize error:", e);
      toast.error("AI özetleme sırasında hata oluştu");
    } finally {
      setSummarizing(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const unsummarized = articles.filter(a => !a.ai_summary).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Anahtar kelime ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] gap-1.5 shrink-0"
          onClick={handleSummarize}
          disabled={summarizing}
        >
          {summarizing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          )}
          {summarizing ? "Özetleniyor..." : "AI Özetle"}
        </Button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={langFilter}
            onValueChange={(v) => { if (v) { setLangFilter(v as LangFilter); setPage(0); } }}
            size="sm"
            className="gap-0.5"
          >
            <ToggleGroupItem value="all" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Tümü
            </ToggleGroupItem>
            <ToggleGroupItem value="tr" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              🇹🇷 TR
            </ToggleGroupItem>
            <ToggleGroupItem value="en" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              🌍 EN
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
          <ToggleGroup
            type="single"
            value={dateRange}
            onValueChange={(v) => { if (v) { setDateRange(v as DateRange); setPage(0); } }}
            size="sm"
            className="gap-0.5"
          >
            <ToggleGroupItem value="7" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              7 gün
            </ToggleGroupItem>
            <ToggleGroupItem value="30" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              30 gün
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="h-5 px-2 text-[10px] rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Tümü
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Toplam: {total} haber
        </span>
      </div>

      {tagFilter && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Etiket filtresi:</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            {tagFilter}
            <button onClick={() => { setTagFilter(null); setPage(0); }}>
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">Yükleniyor...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Archive className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Henüz arşivlenmiş haber yok.</p>
          <p className="text-[10px] text-muted-foreground">Haberler RSS yenilemesinde otomatik kaydedilir.</p>
        </div>
      ) : (
        <ScrollArea className="h-[360px] pr-3">
          <div className="space-y-2">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Newspaper className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{article.title}</p>

                    {article.ai_summary ? (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-primary/80 leading-snug">{article.ai_summary}</p>
                      </div>
                    ) : article.description ? (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.description}</p>
                    ) : null}

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {article.language === "en" ? "🌍" : "🇹🇷"} {article.source}
                      </Badge>

                      {article.ai_tags && article.ai_tags.length > 0 && article.ai_tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTagFilter(tag);
                            setPage(0);
                          }}
                          className={`inline-flex items-center text-[9px] px-1.5 py-0 rounded-full font-medium ${getTagColor(tag)} hover:opacity-80 transition-opacity`}
                        >
                          #{tag}
                        </button>
                      ))}

                      {article.pub_date && (
                        <span className="text-[10px] text-muted-foreground">{article.pub_date}</span>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 ml-auto">
                        {new Date(article.fetched_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Önceki
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsArchive;
