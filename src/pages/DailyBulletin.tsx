import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/ThemeToggle";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { Link } from "react-router-dom";
import {
  Newspaper, Play, Pause, Square, Volume2, VolumeX,
  Calendar, ArrowLeft, RefreshCw, Radio, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface DailySummary {
  id: string;
  created_at: string;
  summary_date: string;
  summary_text: string;
  news_count: number;
  tr_count: number;
  en_count: number;
  rss_errors: string[];
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-foreground mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-foreground mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-foreground mt-8 mb-4">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function PodcastPlayer({ text }: { text: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const totalCharsRef = useRef(0);
  const spokenCharsRef = useRef(0);

  const cleanText = text
    .replace(/[#*_`]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ");

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const play = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stop();
    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.lang = "tr-TR";
    utt.rate = rate;
    utt.pitch = 1;
    totalCharsRef.current = cleanText.length;
    spokenCharsRef.current = 0;

    // Try to find a Turkish voice
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find(v => v.lang.startsWith("tr"));
    if (trVoice) utt.voice = trVoice;

    utt.onboundary = (e) => {
      if (e.name === "word") {
        spokenCharsRef.current = e.charIndex;
        setProgress(Math.round((e.charIndex / totalCharsRef.current) * 100));
      }
    };
    utt.onend = () => { stop(); };
    utt.onerror = () => { stop(); };

    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  }, [cleanText, rate, isPaused, stop]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    // Load voices
    window.speechSynthesis.getVoices();
    return () => { stop(); };
  }, [stop]);

  const estimatedMinutes = Math.ceil(cleanText.split(" ").length / (150 * rate));

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Radio className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-semibold text-foreground">🎙️ Podcast Dinle</span>
          <Badge variant="secondary" className="text-xs">~{estimatedMinutes} dk</Badge>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {!isPlaying ? (
            <Button size="sm" onClick={play} className="gap-1">
              <Play className="h-4 w-4" /> {isPaused ? "Devam" : "Dinle"}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={pause} className="gap-1">
              <Pause className="h-4 w-4" /> Duraklat
            </Button>
          )}
          {(isPlaying || isPaused) && (
            <Button size="sm" variant="outline" onClick={stop} className="gap-1">
              <Square className="h-4 w-4" /> Dur
            </Button>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            {[0.75, 1, 1.25, 1.5].map(r => (
              <Button
                key={r}
                size="sm"
                variant={rate === r ? "default" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setRate(r)}
              >
                {r}x
              </Button>
            ))}
          </div>
        </div>

        {(isPlaying || isPaused) && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DailyBulletin() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Handle unsubscribe via URL token
  useEffect(() => {
    const token = searchParams.get("unsubscribe");
    if (token) {
      supabase
        .from("email_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .then(({ error }) => {
          if (error) toast.error("Abonelik iptal edilemedi");
          else toast.success("Aboneliğiniz başarıyla iptal edildi");
        });
    }
  }, [searchParams]);

  const { data: summaries, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["daily-summaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .order("summary_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as DailySummary[];
    },
  });

  const triggerGeneration = async () => {
    try {
      const { error } = await supabase.functions.invoke("daily-news-podcast");
      if (error) throw error;
      refetch();
    } catch (e) {
      console.error("Generation error:", e);
    }
  };

  const current = selectedDate
    ? summaries?.find(s => s.summary_date === selectedDate)
    : summaries?.[0];

  const currentIdx = summaries?.findIndex(s => s.id === current?.id) ?? 0;
  const hasPrev = currentIdx < (summaries?.length ?? 0) - 1;
  const hasNext = currentIdx > 0;

  const navigate = (dir: -1 | 1) => {
    if (!summaries) return;
    const newIdx = currentIdx - dir;
    if (newIdx >= 0 && newIdx < summaries.length) {
      setSelectedDate(summaries[newIdx].summary_date);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Newspaper className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Günlük Su Bülteni</h1>
              <p className="text-xs text-muted-foreground">Sınıraşan Su Havzaları OSINT Analizi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={triggerGeneration}
              disabled={isFetching}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Şimdi Oluştur
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !current ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Henüz bülten yok</h2>
              <p className="text-muted-foreground mb-4">
                İlk bülteni oluşturmak için "Şimdi Oluştur" butonuna tıklayın.
              </p>
              <Button onClick={triggerGeneration} className="gap-2">
                <RefreshCw className="h-4 w-4" /> İlk Bülteni Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <Button
                size="sm" variant="ghost" onClick={() => navigate(-1)}
                disabled={!hasPrev} className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Önceki
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {new Date(current.summary_date + "T00:00:00").toLocaleDateString("tr-TR", {
                    year: "numeric", month: "long", day: "numeric", weekday: "long"
                  })}
                </span>
              </div>
              <Button
                size="sm" variant="ghost" onClick={() => navigate(1)}
                disabled={!hasNext} className="gap-1"
              >
                Sonraki <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{current.news_count}</div>
                  <div className="text-xs text-muted-foreground">Toplam Haber</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">🇹🇷 {current.tr_count}</div>
                  <div className="text-xs text-muted-foreground">Türkçe</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">🌍 {current.en_count}</div>
                  <div className="text-xs text-muted-foreground">İngilizce</div>
                </CardContent>
              </Card>
            </div>

            {/* Podcast Player */}
            <PodcastPlayer text={current.summary_text} />

            {/* Written Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Yazılı Bülten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(current.summary_text) }}
                />
              </CardContent>
            </Card>

            {/* Errors if any */}
            {current.rss_errors && current.rss_errors.length > 0 && (
              <Card className="border-destructive/20">
                <CardContent className="p-3">
                  <p className="text-xs text-destructive">
                    ⚠️ Erişilemeyen kaynaklar: {current.rss_errors.join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Archive List */}
            {summaries && summaries.length > 1 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">📚 Arşiv</h3>
                  <div className="grid gap-2">
                    {summaries.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedDate(s.summary_date)}
                        className={`text-left p-3 rounded-lg border transition ${
                          s.id === current.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {new Date(s.summary_date + "T00:00:00").toLocaleDateString("tr-TR", {
                              year: "numeric", month: "long", day: "numeric"
                            })}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {s.news_count} haber
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
