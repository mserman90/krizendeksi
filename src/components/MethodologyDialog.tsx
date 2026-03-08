import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Droplets, Waves, Leaf, Thermometer, Snowflake, Wind, Sun, TrendingDown, CloudRain } from "lucide-react";

const components = [
  { icon: Waves, label: "Nehir Debisi (Mutlak)", weight: 20, range: "200–2000 m³/s", invert: true, source: "Open-Meteo Flood (GloFAS)", desc: "Fırat ve Dicle nehirlerindeki ortalama debi. Debi düştükçe su stresi artar ve kriz riski yükselir." },
  { icon: CloudRain, label: "Yağış Miktarı", weight: 18, range: "0–80 mm", invert: true, source: "Open-Meteo Forecast", desc: "14 günlük toplam yağış. Yağış azaldıkça havza su bütçesi düşer, kriz riski artar." },
  { icon: Leaf, label: "Toprak Nemi", weight: 14, range: "0.05–0.45 m³/m³", invert: true, source: "Open-Meteo Forecast", desc: "Yüzey toprak nemi (0-7 cm). Toprak kurudukça tarımsal kuraklık riski ve su talebi artar." },
  { icon: TrendingDown, label: "Debi Anomalisi", weight: 10, range: "0.3–1.5 oran", invert: true, source: "Open-Meteo Flood (GloFAS)", desc: "Mevcut debi / medyan debi oranı. Oran 1'in altına düştüğünde debi normalin altında demektir — tarihsel olarak anormal bir düşüş sinyali verir." },
  { icon: Thermometer, label: "Buharlaşma (ET₀)", weight: 10, range: "0–70 mm", invert: false, source: "Open-Meteo Forecast", desc: "FAO Penman-Monteith referans evapotranspirasyonu. Buharlaşma arttıkça su kaybı hızlanır." },
  { icon: Sun, label: "Güneş Radyasyonu", weight: 8, range: "1–8 kWh/m²/gün", invert: false, source: "NASA POWER", desc: "Yüzeye ulaşan kısa dalga radyasyonu. Yüksek radyasyon buharlaşmayı tetikler ve su kaybını artırır." },
  { icon: Droplets, label: "Nem Oranı", weight: 8, range: "20–90 %", invert: true, source: "Open-Meteo Forecast", desc: "Ortalama bağıl nem. Düşük nem atmosferik buharlaşma baskısını artırır, su kaybı hızlanır." },
  { icon: Wind, label: "Rüzgar Hızı", weight: 6, range: "0–60 km/s", invert: false, source: "Open-Meteo Forecast", desc: "Maksimum rüzgar hızı. Yüksek rüzgar su yüzeyinden buharlaşmayı hızlandırır." },
  { icon: Snowflake, label: "Kar Yağışı", weight: 6, range: "0–50 mm", invert: true, source: "Open-Meteo Forecast", desc: "14 günlük toplam kar yağışı. Kar, ilkbaharda nehirleri besleyen doğal su deposudur — azalması gelecekteki akışı tehdit eder." },
];

const MethodologyDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1 ml-auto">
          <Info className="h-3.5 w-3.5" />
          Metodoloji
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Kriz Endeksi Hesaplama Metodolojisi</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Overview */}
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Genel Bakış</h3>
            <p className="text-muted-foreground leading-relaxed">
              Kriz endeksi, Fırat-Dicle havzasının su stresini 0–100 arasında ölçen bileşik bir göstergedir.
              <strong> 9 hidrolojik parametrenin</strong> ağırlıklı ortalaması alınarak hesaplanır.
              Yüksek değerler daha fazla kriz riski anlamına gelir.
            </p>
          </section>

          {/* Formula */}
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Formül</h3>
            <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs leading-relaxed">
              <p className="text-muted-foreground mb-1">Kriz Endeksi =</p>
              <p className="pl-4">
                0.20 × Debi + 0.18 × Yağış + 0.14 × ToprakNemi +
              </p>
              <p className="pl-4">
                0.10 × DebiAnomali + 0.10 × Buharlaşma + 0.08 × GüneşRad +
              </p>
              <p className="pl-4">
                0.08 × Nem + 0.06 × Rüzgar + 0.06 × Kar
              </p>
            </div>
          </section>

          {/* Normalization */}
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Normalizasyon</h3>
            <p className="text-muted-foreground leading-relaxed">
              Her parametre, tarihsel referans aralığına göre 0–100'e normalize edilir.
              <strong> Ters çevrilen</strong> (inverted) parametrelerde düşük değer = yüksek kriz skoru anlamına gelir
              (örn. yağış azaldıkça skor artar). <strong>Normal</strong> yönlü parametrelerde yüksek değer = yüksek kriz skoru
              (örn. buharlaşma arttıkça skor artar).
            </p>
            <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs">
              <p className="text-muted-foreground">normalize(değer, min, max, ters?) =</p>
              <p className="pl-4">oran = (değer - min) / (max - min)</p>
              <p className="pl-4">ters ise: oran = 1 - oran</p>
              <p className="pl-4">skor = oran × 100</p>
            </div>
          </section>

          {/* Components */}
          <section className="space-y-3">
            <h3 className="font-semibold text-base">Bileşenler ({components.length})</h3>
            <div className="space-y-2">
              {components.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{c.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">{c.weight}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                    <div className="flex flex-wrap gap-3 text-[10px]">
                      <span className="text-muted-foreground">
                        📊 Aralık: <span className="font-mono">{c.range}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {c.invert ? "🔄 Ters çevrilmiş" : "➡️ Normal yönlü"}
                      </span>
                      <span className="text-muted-foreground">
                        📡 {c.source}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Crisis Levels */}
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Kriz Seviyeleri</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2.5 bg-green-500/10 border-green-500/30">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">0–24: Düşük</p>
                <p className="text-[10px] text-muted-foreground">Havza su dengesi normal sınırlarda</p>
              </div>
              <div className="rounded-lg border p-2.5 bg-yellow-500/10 border-yellow-500/30">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">25–49: Orta</p>
                <p className="text-[10px] text-muted-foreground">Bazı parametrelerde stres belirtileri</p>
              </div>
              <div className="rounded-lg border p-2.5 bg-orange-500/10 border-orange-500/30">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">50–74: Yüksek</p>
                <p className="text-[10px] text-muted-foreground">Ciddi su stresi, yakın izleme gerekli</p>
              </div>
              <div className="rounded-lg border p-2.5 bg-red-500/10 border-red-500/30">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">75–100: Kritik</p>
                <p className="text-[10px] text-muted-foreground">Acil müdahale gerekebilir</p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Veri Kaynakları</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li><strong>Open-Meteo Forecast API</strong> — Yağış, buharlaşma, toprak nemi, sıcaklık, nem, rüzgar, kar</li>
              <li><strong>Open-Meteo Flood API (GloFAS)</strong> — Nehir debisi ve medyan debi</li>
              <li><strong>NASA POWER API</strong> — Güneş radyasyonu (ALLSKY_SFC_SW_DWN), yağış (yedek)</li>
            </ul>
          </section>

          {/* Update Info */}
          <section className="rounded-lg bg-muted/30 border border-border/50 p-3 text-[10px] text-muted-foreground">
            <p>📅 Veriler 14 günlük pencere ile çekilir ve 6 saatte bir otomatik kontrol edilir.</p>
            <p>⚠️ Eşik değeri aşıldığında otomatik uyarı kaydı oluşturulur.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MethodologyDialog;
