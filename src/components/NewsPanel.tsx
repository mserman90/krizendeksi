import type { NewsItem } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";

interface NewsPanelProps {
  items: NewsItem[];
}

const NewsPanel = ({ items }: NewsPanelProps) => {
  return (
    <ScrollArea className="h-[300px] pr-3">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors"
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
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NewsPanel;
