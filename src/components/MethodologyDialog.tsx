import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info, Droplets, Waves, Leaf, Thermometer, Snowflake, Wind, Sun, TrendingDown, CloudRain, Shield, ShieldAlert, Brain, PackageOpen, Zap, Crosshair, GitCompareArrows } from "lucide-react";

const hydroComponents = [
  { icon: Waves, label: "Nehir Debisi (Mutlak)", weight: 20, range: "200–2000 m³/s", invert: true, source: "Open-Meteo Flood (GloFAS)", desc: "Fırat ve Dicle nehirlerindeki ortalama debi. Debi düştükçe su stresi artar ve kriz riski yükselir." },
  { icon: CloudRain, label: "Yağış Miktarı", weight: 18, range: "0–80 mm", invert: true, source: "Open-Meteo Forecast", desc: "14 günlük toplam yağış. Yağış azaldıkça havza su bütçesi düşer, kriz riski artar." },
  { icon: Leaf, label: "Toprak Nemi", weight: 14, range: "0.05–0.45 m³/m³", invert: true, source: "Open-Meteo Forecast", desc: "Yüzey toprak nemi (0-7 cm). Toprak kurudukça tarımsal kuraklık riski ve su talebi artar." },
  { icon: TrendingDown, label: "Debi Anomalisi", weight: 10, range: "0.3–1.5 oran", invert: true, source: "Open-Meteo Flood (GloFAS)", desc: "Mevcut debi / medyan debi oranı. Oran 1'in altına düştüğünde debi normalin altında demektir." },
  { icon: Thermometer, label: "Buharlaşma (ET₀)", weight: 10, range: "0–70 mm", invert: false, source: "Open-Meteo Forecast", desc: "FAO Penman-Monteith referans evapotranspirasyonu. Buharlaşma arttıkça su kaybı hızlanır." },
  { icon: Sun, label: "Güneş Radyasyonu", weight: 8, range: "1–8 kWh/m²/gün", invert: false, source: "NASA POWER", desc: "Yüzeye ulaşan kısa dalga radyasyonu. Yüksek radyasyon buharlaşmayı tetikler." },
  { icon: Droplets, label: "Nem Oranı", weight: 8, range: "20–90 %", invert: true, source: "Open-Meteo Forecast", desc: "Ortalama bağıl nem. Düşük nem atmosferik buharlaşma baskısını artırır." },
  { icon: Wind, label: "Rüzgar Hızı", weight: 6, range: "0–60 km/s", invert: false, source: "Open-Meteo Forecast", desc: "Maksimum rüzgar hızı. Yüksek rüzgar su yüzeyinden buharlaşmayı hızlandırır." },
  { icon: Snowflake, label: "Kar Yağışı", weight: 6, range: "0–50 mm", invert: true, source: "Open-Meteo Forecast", desc: "14 günlük toplam kar yağışı. Kar azalması gelecekteki akışı tehdit eder." },
];

const natoComponents = [
  { icon: ShieldAlert, label: "CCSRT", fullLabel: "İklim Güvenlik Risk Eşiği", weight: 25, desc: "Yağış açığı (%40), debi düşüşü (%35) ve buharlaşma baskısı (%25) birleşimi. Su kullanılabilirliği güvenlik-kritik eşiklerin altına düştüğünde tetiklenir. 7BLR: Gıda/Su Temini, Enerji Arzı.", source: "NATO CCSIA 2024 — Food & Water Resources, Energy Supply" },
  { icon: Brain, label: "PACA", fullLabel: "Öngörücü Adaptif Kapasite", weight: 25, desc: "Debi anomali oranı, toprak nemi sapması ve nem düşüşü göstergelerinin ortalaması + varyans amplifikasyonu. Büyük sapma = düşük adaptif kapasite. Varyans tabanlı hesaplama: göstergeler arası tutarsızlık riski artırır. 7BLR: Sivil İletişim, Yönetim Sürekliliği.", source: "NATO 7BLR — Adaptive Capacity / Continuity of Government" },
  { icon: PackageOpen, label: "RSI", fullLabel: "Kaynak Kıtlığı Endeksi", weight: 20, desc: "Toprak kuruluğu (%30), yağış açığı (%30), kar deposu (%25) ve rüzgar kurutma etkisi (%15). Çok boyutlu kaynak tükenme göstergesi. 7BLR: Gıda/Su Temini, Enerji Arzı.", source: "NATO CCSIA 2024 — Resource Scarcity / Food Security" },
  { icon: Zap, label: "BlackStart", fullLabel: "Altyapı Çöküş Potansiyeli", weight: 20, desc: "Düşük akış riski, güneş yükü ve buharlaşma baskısının bileşik stresi. 2+ faktör eşzamanlı olarak >60 skora ulaştığında ×1.15 bileşik çarpan. NATO şebeke dayanıklılık konseptinden esinlenmiştir. 7BLR: Sivil Ulaşım, Enerji, Kitle Kayıp Yönetimi.", source: "NATO 7BLR — Civil Transport, Energy Supply, Mass Casualty" },
  { icon: Crosshair, label: "Kinetic", fullLabel: "Çatışma & Yerinden Edilme Tetikleyicisi", weight: 10, desc: "Diğer 4 sütunun ortalama stresine üstel amplifikasyon (concurrent stress^1.5 × 0.5). Tüm sütunlar stres altındayken risk katlanarak artar. NATO 'threat multiplier' konsepti. 7BLR: Kontrolsüz Nüfus Hareketleri, Yönetim Sürekliliği.", source: "NATO CCSIA 2024 — Threat Multiplier / Cascading Risk" },
];

const HydroComponentList = ({ items }: { items: typeof hydroComponents }) => (
  <div className="space-y-2">
    {items.map((c) => {
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
            <span className="text-muted-foreground">📊 Aralık: <span className="font-mono">{c.range}</span></span>
            <span className="text-muted-foreground">{c.invert ? "🔄 Ters çevrilmiş" : "➡️ Normal yönlü"}</span>
            <span className="text-muted-foreground">📡 {c.source}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const NatoComponentList = ({ items }: { items: typeof natoComponents }) => (
  <div className="space-y-2">
    {items.map((c) => {
      const Icon = c.icon;
      return (
        <div key={c.label} className="rounded-lg border border-border p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold font-mono">{c.label}</span>
              <span className="text-[10px] text-muted-foreground">· {c.fullLabel}</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary">{c.weight}%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
          <div className="text-[10px] text-muted-foreground">📡 {c.source}</div>
        </div>
      );
    })}
  </div>
);

const CrisisLevels = () => (
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
);

const NatoThreatLevels = () => (
  <div className="grid grid-cols-2 gap-2">
    <div className="rounded-lg border p-2.5 bg-green-500/10 border-green-500/30">
      <p className="text-xs font-semibold text-green-700 dark:text-green-400">0–24: ALPHA</p>
      <p className="text-[10px] text-muted-foreground">Normal operasyonel durum</p>
    </div>
    <div className="rounded-lg border p-2.5 bg-yellow-500/10 border-yellow-500/30">
      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">25–49: BRAVO</p>
      <p className="text-[10px] text-muted-foreground">Artan tehdit seviyesi, izleme gerekli</p>
    </div>
    <div className="rounded-lg border p-2.5 bg-orange-500/10 border-orange-500/30">
      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">50–74: CHARLIE</p>
      <p className="text-[10px] text-muted-foreground">Yüksek tehdit, proaktif önlemler</p>
    </div>
    <div className="rounded-lg border p-2.5 bg-red-500/10 border-red-500/30">
      <p className="text-xs font-semibold text-red-700 dark:text-red-400">75–100: DELTA</p>
      <p className="text-[10px] text-muted-foreground">Kritik tehdit, acil müdahale</p>
    </div>
  </div>
);

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

        <Tabs defaultValue="hydro" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="hydro" className="flex-1 gap-1 text-xs">
              <Droplets className="h-3.5 w-3.5" /> Hidrolojik
            </TabsTrigger>
            <TabsTrigger value="nato" className="flex-1 gap-1 text-xs">
              <Shield className="h-3.5 w-3.5" /> NATO 360°
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex-1 gap-1 text-xs">
              <GitCompareArrows className="h-3.5 w-3.5" /> Karşılaştırma
            </TabsTrigger>
          </TabsList>

          {/* Hydro Method Tab */}
          <TabsContent value="hydro" className="space-y-5 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-base">Genel Bakış</h3>
              <p className="text-muted-foreground leading-relaxed">
                Kriz endeksi, havzanın su stresini 0–100 arasında ölçen bileşik bir göstergedir.
                <strong> 9 hidrolojik parametrenin</strong> ağırlıklı ortalaması alınarak hesaplanır.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Formül</h3>
              <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs leading-relaxed">
                <p className="text-muted-foreground mb-1">Kriz Endeksi =</p>
                <p className="pl-4">0.20 × Debi + 0.18 × Yağış + 0.14 × ToprakNemi +</p>
                <p className="pl-4">0.10 × DebiAnomali + 0.10 × Buharlaşma + 0.08 × GüneşRad +</p>
                <p className="pl-4">0.08 × Nem + 0.06 × Rüzgar + 0.06 × Kar</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Normalizasyon</h3>
              <p className="text-muted-foreground leading-relaxed">
                Her parametre, tarihsel referans aralığına göre 0–100'e normalize edilir.
                <strong> Ters çevrilen</strong> parametrelerde düşük değer = yüksek kriz skoru.
              </p>
              <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs">
                <p className="text-muted-foreground">normalize(değer, min, max, ters?) =</p>
                <p className="pl-4">oran = (değer - min) / (max - min)</p>
                <p className="pl-4">ters ise: oran = 1 - oran</p>
                <p className="pl-4">skor = oran × 100</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-base">Bileşenler ({hydroComponents.length})</h3>
              <HydroComponentList items={hydroComponents} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Kriz Seviyeleri</h3>
              <CrisisLevels />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Veri Kaynakları</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Open-Meteo Forecast API</strong> — Yağış, buharlaşma, toprak nemi, nem, rüzgar, kar</li>
                <li><strong>Open-Meteo Flood API (GloFAS)</strong> — Nehir debisi ve medyan debi</li>
                <li><strong>NASA POWER API</strong> — Güneş radyasyonu (ALLSKY_SFC_SW_DWN)</li>
              </ul>
            </section>
          </TabsContent>

          {/* NATO 360° / 7BLR Tab */}
          <TabsContent value="nato" className="space-y-5 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> NATO 360° Güvenlik / 7BLR Yöntemi
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                NATO'nun <strong>"360 derece güvenlik"</strong> konsepti ve <strong>7 Temel Ulusal Direnç
                (7 Baseline Requirements for National Resilience)</strong> standartlarına dayalı
                bütünleşik risk skoru. İklim değişikliğini bir <strong>"tehdit çarpanı" (threat multiplier)</strong>
                olarak ele alır.
              </p>
            </section>

            {/* 7BLR Overview */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">7 Temel Ulusal Direnç (7BLR)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                {[
                  "1. Sivil yönetimin sürekliliği",
                  "2. Dayanıklı enerji arzı",
                  "3. Kontrolsüz nüfus hareketlerini yönetme",
                  "4. Dayanıklı gıda ve su kaynakları",
                  "5. Kitle kayıplarını yönetme",
                  "6. Dayanıklı sivil iletişim sistemleri",
                  "7. Dayanıklı sivil ulaşım sistemleri",
                ].map((item) => (
                  <div key={item} className="rounded border border-border/50 p-1.5 text-muted-foreground bg-muted/30">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">S_Allied Formülü</h3>
              <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs leading-relaxed">
                <p className="text-muted-foreground mb-1">S_Allied =</p>
                <p className="pl-4">(CCSRT × 0.25) + (PACA × 0.25) +</p>
                <p className="pl-4">(RSI × 0.20) + (BlackStart × 0.20) + (Kinetic × 0.10)</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground mt-2">
                <p className="font-medium text-foreground mb-1">Anahtar Farklar:</p>
                <ul className="space-y-1 list-disc pl-3">
                  <li><strong>Varyans tabanlı PACA:</strong> Göstergeler arası tutarsızlık adaptif kapasite düşüklüğünü gösterir</li>
                  <li><strong>BlackStart bileşik çarpan:</strong> 2+ altyapı faktörü &gt;60 olduğunda ×1.15 amplifikasyon</li>
                  <li><strong>Kinetic üstel çarpan:</strong> Eşzamanlı stres sayısının ^1.5 üssel artışı</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-base">Alt Endeksler ({natoComponents.length})</h3>
              <NatoComponentList items={natoComponents} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Tehdit Seviyeleri (THREATCON)</h3>
              <NatoThreatLevels />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">NATO Referansları</h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>
                  <strong>NATO CCSIA Third Edition (2024)</strong> — Climate Change and Security Impact Assessment
                  <br />
                  <a href="https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2024/7/pdf/240709-Climate-Security-Impact.pdf" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">PDF →</a>
                </li>
                <li>
                  <strong>NATO Climate Change Action Plan — Best Practices (2023)</strong>
                  <br />
                  <a href="https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2023/7/pdf/230710-climate-change-best-practices.pdf" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">PDF →</a>
                </li>
                <li>
                  <strong>STO-TR-SAS-182</strong> — NATO Science & Technology Organization Technical Report
                  <br />
                  <a href="https://publications.sto.nato.int/publications/STO%20Technical%20Reports/STO-TR-SAS-182/TR-SAS-182-ALL.pdf" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">PDF →</a>
                </li>
                <li>
                  <strong>COEDAT</strong> — Climate Change and Terrorism Research
                  <br />
                  <a href="https://www.coedat.nato.int/publication/researches/22-Climate_ChangeandTerrorism.pdf" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">PDF →</a>
                </li>
                <li>
                  <strong>NATO 7 Baseline Requirements</strong> — National Resilience Guidelines
                </li>
              </ul>
            </section>

            <section className="rounded-lg bg-muted/30 border border-border/50 p-3 text-[10px] text-muted-foreground space-y-1">
              <p>🛡️ NATO 7BLR: Sivil yönetim sürekliliği, enerji arzı, kontrolsüz nüfus hareketleri, gıda/su kaynakları, kitle kayıp yönetimi, sivil iletişim ve sivil ulaşım dayanıklılığı.</p>
              <p>⚡ BlackStart konsepti: Elektrik şebekesinin tamamen çökmesi durumunda dışarıdan enerji kaynağı olmadan sistemi yeniden başlatma kapasitesi.</p>
              <p>🎯 Kinetic tetikleyici: Çoklu kriz sütunlarının eşzamanlı aktivasyonunda doğrusal olmayan (non-linear) risk artışı modeli.</p>
            </section>
          </TabsContent>
        </Tabs>

        <section className="rounded-lg bg-muted/30 border border-border/50 p-3 text-[10px] text-muted-foreground">
          <p>📅 Veriler 14 günlük pencere ile çekilir ve 6 saatte bir otomatik kontrol edilir.</p>
          <p>⚠️ Eşik değeri aşıldığında otomatik uyarı kaydı oluşturulur.</p>
        </section>
      </DialogContent>
    </Dialog>
  );
};

export default MethodologyDialog;
