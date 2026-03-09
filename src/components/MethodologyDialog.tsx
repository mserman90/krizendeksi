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

            <section className="space-y-2">
              <h3 className="font-semibold text-base">Bilimsel Referanslar (APA 7)</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5 text-[11px] text-muted-foreground leading-relaxed">

                <p className="font-semibold text-foreground text-xs mb-1">Normalizasyon & Bileşik Endeks Yöntemi</p>

                <p className="pl-3 -indent-3">
                  Svoboda, M., Hayes, M., & Wood, D. (2012). <em>Standardized precipitation index user guide</em> (WMO-No. 1090). World Meteorological Organization.
                  <br /><a href="https://library.wmo.int/idurl/4/39629" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://library.wmo.int/idurl/4/39629</a>
                </p>

                <p className="pl-3 -indent-3">
                  Hao, Z., & AghaKouchak, A. (2013). Multivariate standardized drought index: A parametric multi-index model. <em>Advances in Water Resources</em>, <em>57</em>, 12–18.
                  <br /><a href="https://doi.org/10.1016/j.advwatres.2013.03.009" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1016/j.advwatres.2013.03.009</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Nehir Debisi & GloFAS</p>

                <p className="pl-3 -indent-3">
                  Harrigan, S., Zsoter, E., Alfieri, L., Prudhomme, C., Salamon, P., Wetterhall, F., Barnard, C., Cloke, H., & Pappenberger, F. (2020). GloFAS-ERA5 operational global river discharge reanalysis 1979–present. <em>Earth System Science Data</em>, <em>12</em>(3), 2043–2060.
                  <br /><a href="https://doi.org/10.5194/essd-12-2043-2020" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.5194/essd-12-2043-2020</a>
                </p>

                <p className="pl-3 -indent-3">
                  Alfieri, L., Burek, P., Dutra, E., Krzeminski, B., Muraro, D., Thielen, J., & Pappenberger, F. (2013). GloFAS – global ensemble streamflow forecasting and flood early warning. <em>Hydrology and Earth System Sciences</em>, <em>17</em>(3), 1161–1175.
                  <br /><a href="https://doi.org/10.5194/hess-17-1161-2013" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.5194/hess-17-1161-2013</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Evapotranspirasyon (FAO Penman-Monteith)</p>

                <p className="pl-3 -indent-3">
                  Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). <em>Crop evapotranspiration: Guidelines for computing crop water requirements</em> (FAO Irrigation and Drainage Paper No. 56). Food and Agriculture Organization of the United Nations.
                  <br /><a href="https://www.fao.org/4/X0490E/X0490E00.htm" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://www.fao.org/4/X0490E/X0490E00.htm</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Toprak Nemi & Kuraklık</p>

                <p className="pl-3 -indent-3">
                  Dorigo, W. A., Wagner, W., Hohensinn, R., Hahn, S., Paulik, C., Xaver, A., Gruber, A., Drusch, M., Mecklenburg, S., van Oevelen, P., Robock, A., & Jackson, T. (2011). The International Soil Moisture Network: A data hosting facility for global in situ soil moisture measurements. <em>Hydrology and Earth System Sciences</em>, <em>15</em>(5), 1675–1698.
                  <br /><a href="https://doi.org/10.5194/hess-15-1675-2011" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.5194/hess-15-1675-2011</a>
                </p>

                <p className="pl-3 -indent-3">
                  Sheffield, J., & Wood, E. F. (2008). Global trends and variability in soil moisture and drought characteristics, 1950–2000, from observation-driven simulations of the terrestrial hydrologic cycle. <em>Journal of Climate</em>, <em>21</em>(3), 432–458.
                  <br /><a href="https://doi.org/10.1175/2007JCLI1822.1" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1175/2007JCLI1822.1</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Güneş Radyasyonu (NASA POWER)</p>

                <p className="pl-3 -indent-3">
                  Stackhouse, P. W., Zhang, T., Westberg, D., Barnett, A. J., Bristow, T., Macpherson, B., & Hoell, J. M. (2018). POWER release 8 (with GIS applications) methodology (Version 2.0). NASA Langley Research Center.
                  <br /><a href="https://power.larc.nasa.gov/docs/methodology/" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://power.larc.nasa.gov/docs/methodology/</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Sınıraşan Su Kaynakları & Fırat-Dicle Havzası</p>

                <p className="pl-3 -indent-3">
                  Yetim, F. (2023). The hydropolitics of the Euphrates–Tigris River Basin: Transboundary water disputes in the Middle East. <em>Water Policy</em>, <em>25</em>(3), 312–330.
                  <br /><a href="https://doi.org/10.2166/wp.2023.182" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.2166/wp.2023.182</a>
                </p>

                <p className="pl-3 -indent-3">
                  Voss, K. A., Famiglietti, J. S., Lo, M., de Linage, C., Rodell, M., & Swenson, S. C. (2013). Groundwater depletion in the Middle East from GRACE with implications for transboundary water management in the Tigris-Euphrates-Western Iran region. <em>Water Resources Research</em>, <em>49</em>(2), 904–914.
                  <br /><a href="https://doi.org/10.1002/wrcr.20078" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1002/wrcr.20078</a>
                </p>

                <p className="pl-3 -indent-3">
                  Kavvas, M. L., Chen, Z. Q., Dogrul, C., Yoon, J. Y., Ohara, N., Liang, L., Aksoy, H., Anderson, M. L., Yoshitani, J., Fukami, K., & Matsuura, T. (2006). Watershed environmental hydrology (WEHY) model based on upscaled conservation equations: Hydrologic module. <em>Journal of Hydrologic Engineering</em>, <em>11</em>(2), 173–181.
                  <br /><a href="https://doi.org/10.1061/(ASCE)1084-0699(2006)11:2(173)" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1061/(ASCE)1084-0699(2006)11:2(173)</a>
                </p>

                <p className="font-semibold text-foreground text-xs mb-1 mt-3">Bileşik Kuraklık & Su Stresi Endeksleri</p>

                <p className="pl-3 -indent-3">
                  Mishra, A. K., & Singh, V. P. (2010). A review of drought concepts. <em>Journal of Hydrology</em>, <em>391</em>(1–2), 202–216.
                  <br /><a href="https://doi.org/10.1016/j.jhydrol.2010.07.012" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1016/j.jhydrol.2010.07.012</a>
                </p>

                <p className="pl-3 -indent-3">
                  Keyantash, J., & Dracup, J. A. (2002). The quantification of drought: An evaluation of drought indices. <em>Bulletin of the American Meteorological Society</em>, <em>83</em>(8), 1167–1180.
                  <br /><a href="https://doi.org/10.1175/1520-0477-83.8.1167" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1175/1520-0477-83.8.1167</a>
                </p>

                <p className="pl-3 -indent-3">
                  Zargar, A., Sadiq, R., Naser, B., & Khan, F. I. (2011). A review of drought indices. <em>Environmental Reviews</em>, <em>19</em>, 333–349.
                  <br /><a href="https://doi.org/10.1139/a11-013" target="_blank" rel="noopener" className="text-primary hover:underline text-[10px]">https://doi.org/10.1139/a11-013</a>
                </p>
              </div>
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

          {/* Comparison Tab */}
          <TabsContent value="compare" className="space-y-5 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <GitCompareArrows className="h-4 w-4 text-primary" /> Yöntem Karşılaştırması
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Hidrolojik ve NATO 360° / 7BLR yöntemlerinin temel farkları, formül yapıları ve teorik çerçeveleri aşağıda karşılaştırmalı olarak sunulmaktadır.
              </p>
            </section>

            {/* Comparison Table */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">Karşılaştırma Tablosu</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[11px] font-bold w-[30%]">Kriter</TableHead>
                      <TableHead className="text-[11px] font-bold w-[35%]">
                        <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Hidrolojik</span>
                      </TableHead>
                      <TableHead className="text-[11px] font-bold w-[35%]">
                        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> NATO 360° / 7BLR</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { criterion: "Teorik Çerçeve", hydro: "Hidrolojik su bütçesi ve fiziksel parametreler", nato: "NATO 360° güvenlik konsepti, 7 Temel Ulusal Direnç (7BLR)" },
                      { criterion: "Yaklaşım", hydro: "Doğrudan ölçüm tabanlı, lineer ağırlıklı ortalama", nato: "Güvenlik merkezli, varyans amplifikasyonlu, non-lineer çarpanlar" },
                      { criterion: "Parametre Sayısı", hydro: "9 hidrolojik gösterge", nato: "5 bileşik alt endeks (CCSRT, PACA, RSI, BlackStart, Kinetic)" },
                      { criterion: "Formül", hydro: "Σ(wᵢ × scoreᵢ), doğrusal toplam", nato: "S_Allied = Σ(wⱼ × Iⱼ) + varyans & bileşik çarpanlar" },
                      { criterion: "Non-lineer Etki", hydro: "Yok — tüm bileşenler bağımsız", nato: "BlackStart ×1.15 bileşik çarpan, Kinetic üstel amplifikasyon (^1.5)" },
                      { criterion: "Adaptif Kapasite", hydro: "Modellenmez", nato: "PACA: varyans tabanlı adaptif kapasite ölçümü" },
                      { criterion: "Altyapı Riski", hydro: "Dolaylı (debi & buharlaşma)", nato: "BlackStart: şebeke çöküş potansiyeli, bileşik stres" },
                      { criterion: "Çatışma/Göç", hydro: "Kapsam dışı", nato: "Kinetic: çatışma tetikleyici, nüfus hareketleri" },
                      { criterion: "Kriz Seviyeleri", hydro: "Düşük / Orta / Yüksek / Kritik (0–100)", nato: "ALPHA / BRAVO / CHARLIE / DELTA (THREATCON)" },
                      { criterion: "Veri Kaynakları", hydro: "Open-Meteo, GloFAS, NASA POWER", nato: "Aynı veri + NATO doktrinel çerçeve" },
                      { criterion: "Güçlü Yanı", hydro: "Şeffaf, tekrarlanabilir, doğrudan fiziksel ölçüm", nato: "Çoklu stres etkileşimi, kaskad risk, güvenlik perspektifi" },
                      { criterion: "Zayıf Yanı", hydro: "Etkileşim/kaskad etkilerini yakalamaz", nato: "Doktrin tabanlı ağırlıklar, ampirik kalibrasyon zor" },
                    ].map((row, i) => (
                      <TableRow key={row.criterion} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        <TableCell className="text-[11px] font-semibold text-foreground py-2.5">{row.criterion}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground py-2.5 leading-relaxed">{row.hydro}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground py-2.5 leading-relaxed">{row.nato}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Formula Comparison Visual */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base">Formül Karşılaştırması</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs">Hidrolojik Endeks</span>
                  </div>
                  <div className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                    <p>HCI = Σ wᵢ × normalize(xᵢ)</p>
                    <p className="mt-1">wᵢ = sabit ağırlıklar</p>
                    <p>normalize = lineer min-max</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Debi 20%", "Yağış 18%", "ToprakNemi 14%", "Anomali 10%", "ET₀ 10%", "Güneş 8%", "Nem 8%", "Rüzgar 6%", "Kar 6%"].map((w) => (
                      <span key={w} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs">NATO S_Allied</span>
                  </div>
                  <div className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                    <p>S = Σ wⱼ × Iⱼ(x₁...xₙ)</p>
                    <p className="mt-1">PACA += σ² amplifikasyon</p>
                    <p>BlackStart × 1.15 (n≥2)</p>
                    <p>Kinetic × (n/4)^1.5</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["CCSRT 25%", "PACA 25%", "RSI 20%", "BlackStart 20%", "Kinetic 10%"].map((w) => (
                      <span key={w} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{w}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Key Differentiators Visual */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base">Temel Farklar</h3>
              <div className="space-y-2">
                {[
                  { label: "Lineerlik", hydro: "Tamamen doğrusal", nato: "Non-lineer çarpanlar", hydroPct: 30, natoPct: 80 },
                  { label: "Etkileşim Modeli", hydro: "Bağımsız parametreler", nato: "Kaskad amplifikasyon", hydroPct: 10, natoPct: 90 },
                  { label: "Güvenlik Perspektifi", hydro: "Fiziksel su stresi", nato: "Ulusal direnç / 7BLR", hydroPct: 20, natoPct: 95 },
                  { label: "Tekrarlanabilirlik", hydro: "Yüksek — sabit formül", nato: "Orta — doktrinel ağırlıklar", hydroPct: 95, natoPct: 60 },
                ].map((d) => (
                  <div key={d.label} className="rounded-lg border border-border p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold">{d.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground">Hidrolojik</span>
                          <span className="text-[9px] font-mono">{d.hydroPct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${d.hydroPct}%` }} />
                        </div>
                        <p className="text-[9px] text-muted-foreground">{d.hydro}</p>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground">NATO 360°</span>
                          <span className="text-[9px] font-mono">{d.natoPct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${d.natoPct}%` }} />
                        </div>
                        <p className="text-[9px] text-muted-foreground">{d.nato}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* APA 7 References */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base">Kaynakça (APA 7)</h3>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hidrolojik Yöntem</h4>
                <div className="space-y-2 text-[10px] text-muted-foreground leading-relaxed pl-4" style={{ textIndent: "-1.5rem", paddingLeft: "1.5rem" }}>
                  <p>
                    Zsoter, E., Cloke, H. L., Stephens, E., de Rosnay, P., Muñoz-Sabater, J., Prudhomme, C., & Pappenberger, F. (2019). How well do operational seasonal ensemble streamflow forecasts perform? <em>Journal of Hydrology, 577</em>, 123898. <a href="https://doi.org/10.1016/j.jhydrol.2019.123898" target="_blank" rel="noopener" className="text-primary hover:underline">https://doi.org/10.1016/j.jhydrol.2019.123898</a>
                  </p>
                  <p>
                    Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). <em>Crop evapotranspiration: Guidelines for computing crop water requirements</em> (FAO Irrigation and Drainage Paper No. 56). Food and Agriculture Organization of the United Nations.
                  </p>
                  <p>
                    Stacke, T., & Hagemann, S. (2021). HydroPy (v1.0): A new global hydrology model written in Python. <em>Journal of Hydrology, 601</em>, 126570. <a href="https://doi.org/10.1016/S0022-1694(21)01456-6" target="_blank" rel="noopener" className="text-primary hover:underline">https://doi.org/10.1016/S0022-1694(21)01456-6</a>
                  </p>
                  <p>
                    Open-Meteo. (2024). <em>Open-Meteo Free Weather API</em>. <a href="https://open-meteo.com/" target="_blank" rel="noopener" className="text-primary hover:underline">https://open-meteo.com/</a>
                  </p>
                  <p>
                    NASA. (2024). <em>POWER: Prediction of Worldwide Energy Resources</em>. <a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener" className="text-primary hover:underline">https://power.larc.nasa.gov/</a>
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">NATO 360° / 7BLR Yöntemi</h4>
                <div className="space-y-2 text-[10px] text-muted-foreground leading-relaxed pl-4" style={{ textIndent: "-1.5rem", paddingLeft: "1.5rem" }}>
                  <p>
                    North Atlantic Treaty Organization. (2024). <em>Climate change and security impact assessment: Third edition</em>. NATO. <a href="https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2024/7/pdf/240709-Climate-Security-Impact.pdf" target="_blank" rel="noopener" className="text-primary hover:underline">https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2024/7/pdf/240709-Climate-Security-Impact.pdf</a>
                  </p>
                  <p>
                    North Atlantic Treaty Organization. (2023). <em>Climate change action plan: Best practices</em>. NATO. <a href="https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2023/7/pdf/230710-climate-change-best-practices.pdf" target="_blank" rel="noopener" className="text-primary hover:underline">https://www.nato.int/content/dam/nato/legacy-wcm/media_pdf/2023/7/pdf/230710-climate-change-best-practices.pdf</a>
                  </p>
                  <p>
                    NATO Science and Technology Organization. (2023). <em>Climate change and security</em> (STO-TR-SAS-182). <a href="https://publications.sto.nato.int/publications/STO%20Technical%20Reports/STO-TR-SAS-182/TR-SAS-182-ALL.pdf" target="_blank" rel="noopener" className="text-primary hover:underline">https://publications.sto.nato.int/.../TR-SAS-182-ALL.pdf</a>
                  </p>
                  <p>
                    NATO Centre of Excellence Defence Against Terrorism. (2022). <em>Climate change and terrorism</em>. COEDAT. <a href="https://www.coedat.nato.int/publication/researches/22-Climate_ChangeandTerrorism.pdf" target="_blank" rel="noopener" className="text-primary hover:underline">https://www.coedat.nato.int/.../22-Climate_ChangeandTerrorism.pdf</a>
                  </p>
                  <p>
                    Vetter, T., Reinhardt, J., Flörke, M., van Griensven, A., Hattermann, F., Huang, S., Koch, H., Pechlivanidis, I. G., Plötner, S., Seidou, O., Su, B., Vervoort, R. W., & Krysanova, V. (2017). Evaluation of sources of uncertainty in projected hydrological changes under climate change in 12 large-scale river basins. <em>Climatic Change, 141</em>(3), 419–433. <a href="https://www.sciencedirect.com/science/article/abs/pii/S0022169421014566" target="_blank" rel="noopener" className="text-primary hover:underline">https://doi.org/10.1016/S0022-1694(21)01456-6</a>
                  </p>
                  <p>
                    North Atlantic Treaty Organization. (2021). <em>Strengthened resilience commitment</em> (7 Baseline Requirements for National Resilience). NATO. <a href="https://www.nato.int/cps/en/natohq/topics_132722.htm" target="_blank" rel="noopener" className="text-primary hover:underline">https://www.nato.int/cps/en/natohq/topics_132722.htm</a>
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-muted/30 border border-border/50 p-3 text-[10px] text-muted-foreground space-y-1">
              <p>📊 Her iki yöntem de aynı ham verileri (Open-Meteo, GloFAS, NASA POWER) kullanır ancak farklı teorik çerçevelerle yorumlar.</p>
              <p>🔬 Hidrolojik yöntem fiziksel su stresini doğrudan ölçerken, NATO yöntemi güvenlik ve direnç perspektifinden değerlendirir.</p>
              <p>⚖️ İdeal kullanım: İki yöntemin birlikte değerlendirilmesi, karar vericilere daha kapsamlı bir risk görünümü sunar.</p>
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
