import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Geçerli bir e-posta adresi girin");
      return;
    }

    setLoading(true);
    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from("email_subscribers")
        .select("id, status")
        .eq("email", trimmed)
        .maybeSingle();

      if (existing) {
        if (existing.status === "active") {
          toast.info("Bu e-posta zaten abone listesinde");
          setSubscribed(true);
          return;
        }
        // Re-activate
        await supabase
          .from("email_subscribers")
          .update({ status: "active", unsubscribed_at: null })
          .eq("id", existing.id);
        toast.success("Aboneliğiniz yeniden aktifleştirildi!");
      } else {
        const { error } = await supabase
          .from("email_subscribers")
          .insert({ email: trimmed, status: "active" });
        if (error) throw error;
        toast.success("Başarıyla abone oldunuz! 🎉");
      }
      setSubscribed(true);
    } catch (err) {
      console.error("Subscribe error:", err);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Abone oldunuz! ✉️</p>
            <p className="text-xs text-muted-foreground">
              Günlük su bülteni her sabah 08:00'de e-postanıza gönderilecek.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground">📬 E-posta ile Al</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Günlük su havzası bültenini her sabah e-postanızda okuyun.
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <Input
            type="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm h-9"
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading} className="shrink-0 gap-1 h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Abone Ol
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
