import type { NewsItem } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Newspaper, RefreshCw, Wifi, WifiOff, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsPanelProps {
  items: NewsItem[];
  isLive?: boolean;
  isLoading?: boolean;
  onRefresh?: (filter: boolean) => void;
  error?: string | null;
  filterEnabled?: boolean;
  onFilterChange?: (enabled: boolean) => void;
}

const NewsPanel = ({
  items,
  isLive,
  isLoading,
  onRefresh,
  error,
  filterEnabled = true,
  onFilterChange,
}: NewsPanelProps) => {
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

      {/* Filter toggle */}
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
          {items.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {filterEnabled
                ? "Fırat-Dicle ile ilgili haber bulunamadı. Filtreyi kapatmayı deneyin."
                : "Haber bulunamadı."}
            </p>
          )}
          {items.map((item, i) => (
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
                      {item.source}
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
