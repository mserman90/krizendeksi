import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ChevronLeft, ChevronRight, Archive, CalendarDays } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
}

const PAGE_SIZE = 20;

const NewsArchive = () => {
  const [articles, setArticles] = useState<ArchivedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

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

      const { data, count, error } = await query;
      if (error) throw error;
      setArticles(data ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      console.error("Archive fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, langFilter, dateRange]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-3">
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

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">Yükleniyor...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Archive className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Henüz arşivlenmiş haber yok.</p>
          <p className="text-[10px] text-muted-foreground">Haberler RSS yenilemesinde otomatik kaydedilir.</p>
        </div>
      ) : (
        <ScrollArea className="h-[320px] pr-3">
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
                    {article.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {article.language === "en" ? "🌍" : "🇹🇷"} {article.source}
                      </Badge>
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
