import { useState } from "react";
import type { NewsItem } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Newspaper, RefreshCw, Wifi, WifiOff, Filter, Globe, Languages, Timer, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type LanguageFilter = "all" | "tr" | "en";

interface NewsPanelProps {
  items: NewsItem[];
  isLive?: boolean;
  isLoading?: boolean;
  onRefresh?: (filter: boolean) => void;
  error?: string | null;
  filterEnabled?: boolean;
  onFilterChange?: (enabled: boolean) => void;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (enabled: boolean) => void;
  lastUpdated?: Date | null;
}

const NewsPanel = ({
  items,
  isLive,
  isLoading,
  onRefresh,
  error,
  filterEnabled = true,
  onFilterChange,
  autoRefresh,
  onAutoRefreshChange,
  lastUpdated,
}: NewsPanelProps) => {
  const [langFilter, setLangFilter] = useState<LanguageFilter>("all");

  const filteredItems = items.filter((item) => {
    if (langFilter === "all") return true;
    const lang = item.language || "tr";
    return lang === langFilter;
  });

  return (
    <div className="space-y-2">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {isLive ? "Canlı RSS" : "Örnek Veri"}
          </span>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefresh(filterEnabled)}
            disabled={isLoading}
            className="h-6 px-2 text-[10px]"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        )}
      </div>

      {/* Auto-refresh toggle */}
      {onAutoRefreshChange && (
        <div className="flex items-center gap-2 px-1">
          {autoRefresh ? (
            <Timer className="h-3 w-3 text-primary" />
          ) : (
            <TimerOff className="h-3 w-3 text-muted-foreground" />
          )}
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={onAutoRefreshChange}
            className="scale-75"
          />
          <Label htmlFor="auto-refresh" className="text-[10px] text-muted-foreground cursor-pointer">
            {autoRefresh ? "Otomatik yenileme (15dk)" : "Otomatik yenileme kapalı"}
          </Label>
          {lastUpdated && (
            <span className="text-[9px] text-muted-foreground ml-auto">
              Son: {lastUpdated.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* Language filter */}
      <div className="flex items-center gap-2 px-1">
        <Languages className="h-3 w-3 text-muted-foreground shrink-0" />
        <ToggleGroup
          type="single"
          value={langFilter}
          onValueChange={(v) => v && setLangFilter(v as LanguageFilter)}
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
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filteredItems.length}/{items.length}
        </span>
      </div>

      {/* Topic filter toggle */}
      {onFilterChange && (
        <div className="flex items-center gap-2 px-1">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Switch
            id="news-filter"
            checked={filterEnabled}
            onCheckedChange={onFilterChange}
            className="scale-75"
          />
          <Label htmlFor="news-filter" className="text-[10px] text-muted-foreground cursor-pointer">
            {filterEnabled ? "Fırat-Dicle filtresi açık" : "Tüm haberler"}
          </Label>
        </div>
      )}

      {error && (
        <p className="text-[10px] text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
      )}

      <ScrollArea className="h-[240px] pr-3">
        <div className="space-y-3">
          {filteredItems.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {langFilter !== "all"
                ? `Seçili dilde (${langFilter === "tr" ? "Türkçe" : "İngilizce"}) haber bulunamadı.`
                : filterEnabled
                  ? "Fırat-Dicle ile ilgili haber bulunamadı. Filtreyi kapatmayı deneyin."
                  : "Haber bulunamadı."}
            </p>
          )}
          {filteredItems.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Newspaper className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.language === "en" ? "🌍" : "🇹🇷"} {item.source}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{item.pubDate}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NewsPanel;
