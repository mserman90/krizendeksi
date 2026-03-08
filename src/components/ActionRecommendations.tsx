import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, BookOpen, Shield, Droplets, FileText } from "lucide-react";
import type { HydroCrisisScores, NatoCrisisScores } from "@/lib/mockData";

interface Props {
  hydroScores: HydroCrisisScores | null;
  natoScores: NatoCrisisScores | null;
  basinName: string;
}

interface ActionRow {
  domain: string;
  hydroLevel: string;
  natoLevel: string;
  hydroAction: string;
  natoAction: string;
  rationale: string;
  hydroRef: string;
  natoRef: string;
}

function riskLabel(score: number): string {
  if (score < 25) return "Düşük";
  if (score < 50) return "Orta";
  if (score < 75) return "Yüksek";
  return "Kritik";
}

function riskBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score < 25) return "outline";
  if (score < 50) return "secondary";
  if (score < 75) return "default";
  return "destructive";
}

const ActionRecommendations = ({ hydroScores, natoScores, basinName }: Props) => {
  const actions: ActionRow[] = useMemo(() => {
    const hp = hydroScores?.precipScore ?? 50;
    const hd = hydroScores?.dischargeScore ?? 50;
    const hs = hydroScores?.soilMoistureScore ?? 50;
    const he = hydroScores?.evapScore ?? 50;
    const hsn = hydroScores?.snowScore ?? 50;
    const hh = hydroScores?.humidityScore ?? 50;
    const hw = hydroScores?.windScore ?? 50;
    const hsr = hydroScores?.solarScore ?? 50;
    const hda = hydroScores?.dischargeAnomalyScore ?? 50;

    const nc = natoScores?.ccsrtScore ?? 50;
    const np = natoScores?.pacaScore ?? 50;
    const nr = natoScores?.rsiScore ?? 50;
    const nb = natoScores?.blackStartScore ?? 50;
    const nk = natoScores?.kineticScore ?? 50;

    return [
      {
        domain: "Su Tahsisi ve Baraj Yönetimi",
        hydroLevel: riskLabel(hd),
        natoLevel: riskLabel(nc),
        hydroAction: hd >= 75
          ? "Acil su kısıtlaması: tarımsal sulama kotalarını %40 azalt, sanayi kullanımını dondur"
          : hd >= 50
          ? "Kademeli kısıtlama: sulama öncelik sıralaması uygula, günlük debi izleme başlat"
          : "Rutin izleme: haftalık debi raporu, mevsimsel planlama",
        natoAction: nc >= 75
          ? "THREATCON DELTA: Stratejik su rezervi devreye al, sınıraşan su diplomasisi acil toplantısı"
          : nc >= 50
          ? "THREATCON CHARLIE: Su güvenliği erken uyarı sistemi aktif, diplomatik koordinasyon başlat"
          : "THREATCON ALPHA: Rutin izleme, iklim uyum planı güncellemesi",
        rationale: "Nehir debisi, baraj kapasitesi ve mansap ülke ihtiyaçları doğrudan su güvenliğini belirler. NATO CCSRT eşiği aşıldığında güvenlik boyutu devreye girer.",
        hydroRef: "Şen, Z. (2020)",
        natoRef: "NATO CCSIA (2024)",
      },
      {
        domain: "Tarımsal Kuraklık Müdahalesi",
        hydroLevel: riskLabel(Math.max(hs, hp)),
        natoLevel: riskLabel(nr),
        hydroAction: Math.max(hs, hp) >= 75
          ? "Kriz: Kuraklık ilan et, acil tohum dağıtımı, damla sulamaya geçiş desteği, hasar tespit komisyonu kur"
          : Math.max(hs, hp) >= 50
          ? "Uyarı: Toprak nemi izlemeyi yoğunlaştır, çiftçi bilgilendirme kampanyası, sulama verimliliği denetimi"
          : "Normal: Mevsimsel ekim planı, rutin toprak analizi",
        natoAction: nr >= 75
          ? "RSI KRİTİK: Gıda güvenliği acil eylem planı, stratejik gıda stokları değerlendir, insani yardım koordinasyonu"
          : nr >= 50
          ? "RSI YÜKSEK: Gıda tedarik zinciri stres testi, bölgesel dayanışma protokolü aktif"
          : "RSI NORMAL: Tarımsal üretim projeksiyonları güncelle",
        rationale: "Toprak nemi ve yağış açığı bileşik etkisi tarımsal üretimi doğrudan belirler. RSI çoklu kaynak tükenmesini entegre eder.",
        hydroRef: "Allen et al. (1998)",
        natoRef: "NATO 7BLR-BL5 (2023)",
      },
      {
        domain: "Enerji Altyapısı ve HES Yönetimi",
        hydroLevel: riskLabel(hd),
        natoLevel: riskLabel(nb),
        hydroAction: hd >= 75
          ? "HES üretim kapasitesi kritik: Termal yedekleri devreye al, şebeke yük atma planı hazırla"
          : hd >= 50
          ? "HES üretim düşüşü: Enerji tasarrufu kampanyası, alternatif kaynak entegrasyonu hızlandır"
          : "Normal üretim: Rutin bakım ve kapasite planlaması",
        natoAction: nb >= 75
          ? "BLACK START: Kritik altyapı acil müdahale, enerji şebekesi kaskad arıza senaryosu aktif, sivil koruma alarmı"
          : nb >= 50
          ? "BLACK START UYARI: Altyapı stres testi, yedek enerji kapasitesi doğrula, sivil ulaşım alternatifleri planla"
          : "BLACK START NORMAL: Periyodik dayanıklılık değerlendirmesi",
        rationale: "Hidroelektrik üretimi nehir debisine doğrudan bağlıdır. BlackStart endeksi bileşik altyapı arıza riskini ölçer.",
        hydroRef: "Yıldız, D. (2015)",
        natoRef: "NATO 7BLR-BL3 (2023)",
      },
      {
        domain: "Sınıraşan Su Diplomasisi",
        hydroLevel: riskLabel(hda),
        natoLevel: riskLabel(nk),
        hydroAction: hda >= 75
          ? "Mansap debisi kritik sapma: Acil diplomatik nota, ikili su komisyonu toplantısı, BM Sınıraşan Sular Sözleşmesi referansı"
          : hda >= 50
          ? "Anomali izleme: Diplomatik kanal üzerinden veri paylaşımı, ortak izleme istasyonu teklifi"
          : "Normal koşullar: Rutin veri değişimi, yıllık istişare toplantısı",
        natoAction: nk >= 75
          ? "KİNETİK RİSK: Çatışma önleme mekanizması aktif, göç dalgası hazırlığı, insani koridor planlaması"
          : nk >= 50
          ? "KİNETİK UYARI: Diplomatik gerilim izleme, mülteci akışı modellemesi, sivil toplum koordinasyonu"
          : "KİNETİK NORMAL: Bölgesel istikrar değerlendirmesi",
        rationale: "Debi anomalisi mansap ülkelerin su haklarını doğrudan etkiler. Kinetik endeks çoklu stres faktörlerinin çatışma potansiyelini ölçer.",
        hydroRef: "UN Watercourses Convention (1997)",
        natoRef: "STO-TR-SAS-182 (2024)",
      },
      {
        domain: "Ekolojik Sürdürülebilirlik",
        hydroLevel: riskLabel(Math.max(he, hsr)),
        natoLevel: riskLabel(Math.max(nc, nr)),
        hydroAction: Math.max(he, hsr) >= 75
          ? "Ekolojik kriz: Çevresel akış zorunluluğu, sulak alan koruma acil planı, biyoçeşitlilik izleme yoğunlaştır"
          : Math.max(he, hsr) >= 50
          ? "Uyarı: Evapotranspirasyon izlemeyi artır, ekolojik minimum debi kontrolü, habitat değerlendirmesi"
          : "Normal: Mevsimsel ekolojik raporlama",
        natoAction: Math.max(nc, nr) >= 75
          ? "İKLİM GÜVENLİK KRİTİK: Çevresel göç riski değerlendir, iklim adaptasyon acil fonları aktif"
          : Math.max(nc, nr) >= 50
          ? "İKLİM GÜVENLİK UYARI: Ekosistem tabanlı uyum stratejisi güncelle"
          : "İKLİM GÜVENLİK NORMAL: Uzun vadeli iklim projeksiyon takibi",
        rationale: "Buharlaşma ve güneş radyasyonu ekolojik dengeyi etkiler. CCSRT ve RSI entegre iklim-güvenlik eşiğini yansıtır.",
        hydroRef: "Poff et al. (1997)",
        natoRef: "NATO CCAP (2021)",
      },
      {
        domain: "Sivil Hazırlık ve Halk Sağlığı",
        hydroLevel: riskLabel(Math.max(hh, hw)),
        natoLevel: riskLabel(np),
        hydroAction: Math.max(hh, hw) >= 75
          ? "Halk sağlığı alarmı: Su kalitesi acil testi, içme suyu kaynaklarını değerlendir, sağlık birimlerini uyar"
          : Math.max(hh, hw) >= 50
          ? "Erken uyarı: Su arıtma kapasitesi kontrolü, halk bilgilendirme"
          : "Normal: Rutin su kalitesi izleme",
        natoAction: np >= 75
          ? "PACA KRİTİK: Sivil dayanıklılık planı aktif, acil durum stokları kontrol, iletişim altyapısı test"
          : np >= 50
          ? "PACA UYARI: Hükümet sürekliliği planı güncelle, sivil iletişim yedekliliği doğrula"
          : "PACA NORMAL: Periyodik dayanıklılık tatbikatı",
        rationale: "Nem ve rüzgar koşulları su kalitesini ve hastalık vektörlerini etkiler. PACA adaptif kapasite sapmasını ölçer.",
        hydroRef: "WHO (2017)",
        natoRef: "NATO 7BLR-BL1/BL2 (2023)",
      },
    ];
  }, [hydroScores, natoScores]);

  const hydroIndex = hydroScores?.weeklyIndex ?? 50;
  const natoIndex = natoScores?.weeklyIndex ?? 50;

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-2">
        <CardTitle className="section-title flex items-center gap-2 flex-wrap">
          <FileText className="h-4 w-4 text-primary" />
          Karar Destek Raporu — {basinName}
          <Badge variant="secondary" className="text-[10px]">Karşılaştırmalı</Badge>
        </CardTitle>
        <p className="text-[10px] text-muted-foreground mt-1">
          Risk düzeyine göre karar vericilere önerilen somut tedbirler · Hidrolojik ve NATO 7BLR karşılaştırması
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 bg-card">
            <Droplets className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium">Hidrolojik Endeks:</span>
            <Badge variant={riskBadgeVariant(hydroIndex)} className="text-[10px]">
              {Math.round(hydroIndex)} — {riskLabel(hydroIndex)}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 bg-card">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium">NATO S<sub>Allied</sub>:</span>
            <Badge variant={riskBadgeVariant(natoIndex)} className="text-[10px]">
              {Math.round(natoIndex)} — {riskLabel(natoIndex)}
            </Badge>
          </div>
        </div>

        {/* Action Table */}
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="min-w-[120px] font-bold">Faaliyet Alanı</TableHead>
                <TableHead className="min-w-[70px] text-center font-bold">
                  <span className="flex items-center justify-center gap-1"><Droplets className="h-3 w-3" /> Hidro</span>
                </TableHead>
                <TableHead className="min-w-[180px] font-bold">Hidrolojik Tedbir</TableHead>
                <TableHead className="min-w-[70px] text-center font-bold">
                  <span className="flex items-center justify-center gap-1"><Shield className="h-3 w-3" /> NATO</span>
                </TableHead>
                <TableHead className="min-w-[180px] font-bold">NATO 7BLR Tedbir</TableHead>
                <TableHead className="min-w-[160px] font-bold">Gerekçe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((row, i) => (
                <TableRow key={i} className="text-[10px]">
                  <TableCell className="font-semibold text-foreground">{row.domain}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={riskBadgeVariant(
                      row.hydroLevel === "Kritik" ? 80 : row.hydroLevel === "Yüksek" ? 60 : row.hydroLevel === "Orta" ? 40 : 20
                    )} className="text-[9px]">
                      {row.hydroLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground leading-relaxed">
                    {row.hydroAction}
                    <span className="block mt-1 text-[9px] italic opacity-70">[{row.hydroRef}]</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={riskBadgeVariant(
                      row.natoLevel === "Kritik" ? 80 : row.natoLevel === "Yüksek" ? 60 : row.natoLevel === "Orta" ? 40 : 20
                    )} className="text-[9px]">
                      {row.natoLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground leading-relaxed">
                    {row.natoAction}
                    <span className="block mt-1 text-[9px] italic opacity-70">[{row.natoRef}]</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground leading-relaxed">{row.rationale}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Risk Comparison Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold flex items-center gap-1"><Droplets className="h-3 w-3 text-primary" /> Hidrolojik Bileşen Riskleri</p>
            {hydroScores && [
              { label: "Yağış", val: hydroScores.precipScore },
              { label: "Debi", val: hydroScores.dischargeScore },
              { label: "Toprak Nemi", val: hydroScores.soilMoistureScore },
              { label: "Buharlaşma", val: hydroScores.evapScore },
              { label: "Kar", val: hydroScores.snowScore },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[9px] w-16 text-muted-foreground">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.val, 100)}%`,
                      background: item.val >= 75 ? 'hsl(var(--crisis-critical))' : item.val >= 50 ? 'hsl(var(--crisis-high))' : item.val >= 25 ? 'hsl(var(--crisis-medium))' : 'hsl(var(--crisis-low))',
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono w-6 text-right">{Math.round(item.val)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> NATO 7BLR Bileşen Riskleri</p>
            {natoScores && [
              { label: "CCSRT", val: natoScores.ccsrtScore },
              { label: "PACA", val: natoScores.pacaScore },
              { label: "RSI", val: natoScores.rsiScore },
              { label: "BlackStart", val: natoScores.blackStartScore },
              { label: "Kinetik", val: natoScores.kineticScore },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[9px] w-16 text-muted-foreground">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.val, 100)}%`,
                      background: item.val >= 75 ? 'hsl(var(--crisis-critical))' : item.val >= 50 ? 'hsl(var(--crisis-high))' : item.val >= 25 ? 'hsl(var(--crisis-medium))' : 'hsl(var(--crisis-low))',
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono w-6 text-right">{Math.round(item.val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* APA 7 References */}
        <div className="border-t border-border/50 pt-3 space-y-2">
          <p className="text-[11px] font-bold flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Kaynakça (APA 7)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[9px] text-muted-foreground leading-relaxed">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground/80 mb-1">Hidrolojik Kaynaklar</p>
              <p>Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). <em>Crop evapotranspiration: Guidelines for computing crop water requirements</em> (FAO Irrigation and Drainage Paper No. 56). Food and Agriculture Organization.</p>
              <p>Poff, N. L., Allan, J. D., Bain, M. B., Karr, J. R., Prestegaard, K. L., Richter, B. D., Sparks, R. E., & Stromberg, J. C. (1997). The natural flow regime. <em>BioScience, 47</em>(11), 769–784. https://doi.org/10.2307/1313099</p>
              <p>Şen, Z. (2020). <em>Water structures and climate change impact: A review</em>. <em>Water Resources Management, 34</em>(13), 4197–4216. https://doi.org/10.1007/s11269-020-02665-7</p>
              <p>World Health Organization. (2017). <em>Guidelines for drinking-water quality</em> (4th ed., incorporating 1st addendum). WHO Press.</p>
              <p>Yıldız, D. (2015). <em>Turkey's water policy and the Southeastern Anatolia Project (GAP)</em>. Springer.</p>
              <p>United Nations. (1997). <em>Convention on the Law of the Non-Navigational Uses of International Watercourses</em>. UN General Assembly Resolution 51/229.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground/80 mb-1">NATO / Güvenlik Kaynakları</p>
              <p>North Atlantic Treaty Organization. (2024). <em>Climate change and security impact assessment</em> (3rd ed.). NATO HQ Brussels.</p>
              <p>North Atlantic Treaty Organization. (2023). <em>Strengthened resilience commitment: Seven baseline requirements for national resilience</em>. NATO Official Text.</p>
              <p>North Atlantic Treaty Organization. (2021). <em>NATO climate change and security action plan</em>. NATO HQ Brussels.</p>
              <p>NATO Science and Technology Organization. (2024). <em>Climate change, environmental, and human security challenges</em> (STO-TR-SAS-182). NATO STO.</p>
              <p>Rüttinger, L., Smith, D., Stang, G., Tänzler, D., & Vivekananda, J. (2015). <em>A new climate for peace: Taking action on climate and fragility risks</em>. Adelphi/International Alert/Woodrow Wilson Center/EUISS.</p>
              <p>Gleick, P. H. (2014). Water, drought, climate change, and conflict in Syria. <em>Weather, Climate, and Society, 6</em>(3), 331–340. https://doi.org/10.1175/WCAS-D-13-00059.1</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-md border border-border/50 bg-muted/30 p-2.5">
          <p className="text-[9px] text-muted-foreground flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            <span>
              Bu rapor açık kaynak istihbarat (OSINT) verilerine dayalı otomatik analiz sonucudur. 
              Kesin karar verme süreçlerinde saha doğrulaması ve uzman değerlendirmesi gereklidir.
              Tedbirler, mevcut risk düzeyine göre dinamik olarak güncellenmektedir.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionRecommendations;
