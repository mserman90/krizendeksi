

# Fırat-Dicle Haftalık OSINT Dashboard - Uygulama Planı

## Özet

Python scriptindeki mantığı React dashboard'a çevireceğiz. GEE backend olmadığından, gerçekçi mock verilerle çalışan tam bir OSINT izleme paneli oluşturacağız. RSS/haber çekme işlemi için ileride Supabase Edge Function eklenebilir.

## Oluşturulacak Dosyalar

### 1. Veri Katmanı
- **`src/lib/mockData.ts`** - Haftalık GEE metrikleri (rezervuar alanı, yağış), haber verileri ve tarihsel veriler için mock data generator. Python scriptindeki `normalize()` ve `compute_weekly_crisis_index()` fonksiyonlarının TypeScript karşılıkları.

### 2. Dashboard Sayfası
- **`src/pages/Index.tsx`** - Ana dashboard sayfası. Tüm widget'ları barındıran layout.

### 3. Bileşenler
- **`src/components/CrisisGauge.tsx`** - Haftalık kriz endeksi göstergesi (0-100 arası, renkli gauge). `area_score`, `rain_score`, `news_score` ağırlıklı birleşimi.
- **`src/components/ReservoirChart.tsx`** - Recharts ile son 12 haftalık rezervuar su alanı (km²) zaman serisi grafiği.
- **`src/components/RainfallChart.tsx`** - Haftalık yağış (mm) bar chart.
- **`src/components/NewsPanel.tsx`** - Fırat-Dicle anahtar kelimeli haber listesi (mock RSS verileri). Kaynak, tarih, başlık ve link gösterimi.
- **`src/components/ScoreBreakdown.tsx`** - Alan skoru, yağış skoru, haber skoru kartları ile detaylı breakdown.
- **`src/components/BasinInfo.tsx`** - Havza ve rezervuar temel bilgi kartı (Atatürk Barajı, konum vb.).

### 4. Dashboard Tasarımı

```text
┌─────────────────────────────────────────────┐
│  Fırat-Dicle Haftalık OSINT İzleme Paneli   │
├──────────────┬──────────────┬───────────────┤
│ Kriz Endeksi │  Alan Skoru  │ Yağış Skoru   │
│   (Gauge)    │   (Card)     │   (Card)      │
├──────────────┴──────────────┴───────────────┤
│  Rezervuar Alanı Grafiği (12 hafta)         │
├─────────────────────┬───────────────────────┤
│  Yağış Grafiği      │  Haber Paneli         │
│  (Bar Chart)        │  (Scrollable List)    │
├─────────────────────┴───────────────────────┤
│  Havza Bilgileri & Skor Detayları           │
└─────────────────────────────────────────────┘
```

## Teknik Detaylar

- Kriz endeksi hesaplama: Python scriptindeki `compute_weekly_crisis_index` mantığı birebir TypeScript'e çevrilecek (ağırlıklar: alan %40, yağış %30, haber %30)
- Mock data: 12 haftalık gerçekçi zaman serisi verisi (mevsimsel varyasyon ile)
- Recharts kullanılacak (zaten yüklü)
- Tailwind + shadcn/ui kartları ile responsive tasarım
- Koyu tema uyumlu renk paleti (kriz seviyesine göre yeşil-sarı-kırmızı)

