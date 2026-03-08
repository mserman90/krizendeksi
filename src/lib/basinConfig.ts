export interface BasinConfig {
  id: string;
  name: string;
  shortName: string;
  countries: string[];
  center: { lat: number; lon: number };
  floodPoints: { lat: number; lon: number; name: string }[];
  mapCenter: [number, number];
  mapZoom: number;
  boundary: [number, number][];
  rivers: { name: string; path: [number, number][] }[];
  dams: { name: string; lat: number; lng: number; river: string; capacity: string; type: string }[];
  facts: { label: string; value: string }[];
  rssKeywords: string[];
}

export const BASINS: BasinConfig[] = [
  {
    id: "firat-dicle",
    name: "Fırat-Dicle Havzası",
    shortName: "Fırat-Dicle",
    countries: ["Türkiye", "Suriye", "Irak"],
    center: { lat: 37.8, lon: 39.5 },
    floodPoints: [
      { lat: 37.47, lon: 38.33, name: "Atatürk" },
      { lat: 36.85, lon: 40.42, name: "Dicle-Hasankeyf" },
    ],
    mapCenter: [37.5, 40.0],
    mapZoom: 6,
    boundary: [
      [39.8, 36.0], [40.2, 37.5], [40.0, 39.0], [39.5, 40.5],
      [38.5, 41.5], [37.8, 42.5], [37.0, 43.5], [36.5, 44.0],
      [35.5, 44.5], [34.5, 44.0], [33.5, 43.5], [33.0, 42.0],
      [33.5, 40.5], [34.0, 39.0], [34.5, 38.0], [35.0, 37.0],
      [35.5, 36.5], [36.5, 36.0], [37.5, 35.5], [38.5, 35.5],
      [39.8, 36.0],
    ],
    rivers: [
      { name: "Fırat", path: [[39.7, 36.2], [39.5, 37.0], [39.0, 38.0], [38.8, 38.7], [38.2, 38.9], [37.5, 38.3], [37.0, 38.0], [36.5, 38.0], [36.0, 38.5], [35.5, 39.5], [34.5, 40.5], [33.5, 42.0], [33.0, 43.5]] },
      { name: "Dicle", path: [[38.5, 40.0], [38.0, 40.2], [37.9, 40.5], [37.5, 41.0], [37.4, 41.8], [37.0, 42.5], [36.5, 43.0], [35.5, 43.5], [34.5, 44.0], [33.5, 44.0], [33.0, 43.5]] },
    ],
    dams: [
      { name: "Atatürk Barajı", lat: 37.4833, lng: 38.3167, river: "Fırat", capacity: "48.7 milyar m³", type: "Kaya dolgu" },
      { name: "Keban Barajı", lat: 38.8167, lng: 38.7500, river: "Fırat", capacity: "31.0 milyar m³", type: "Beton kemer" },
      { name: "Karakaya Barajı", lat: 38.2333, lng: 38.9500, river: "Fırat", capacity: "9.58 milyar m³", type: "Kaya dolgu" },
      { name: "Birecik Barajı", lat: 37.0333, lng: 37.9833, river: "Fırat", capacity: "1.22 milyar m³", type: "Beton ağırlık" },
      { name: "Ilısu Barajı", lat: 37.4500, lng: 41.7667, river: "Dicle", capacity: "10.4 milyar m³", type: "Beton ağırlık" },
      { name: "Dicle Barajı", lat: 37.9000, lng: 40.2333, river: "Dicle", capacity: "0.6 milyar m³", type: "Kaya dolgu" },
    ],
    facts: [
      { label: "Havza", value: "Fırat-Dicle (Mezopotamya)" },
      { label: "Ana Baraj", value: "Atatürk Barajı (Şanlıurfa)" },
      { label: "Havza Alanı", value: "≈ 879.790 km²" },
      { label: "Fırat Uzunluğu", value: "2.800 km" },
      { label: "Dicle Uzunluğu", value: "1.900 km" },
    ],
    rssKeywords: ["fırat", "dicle", "euphrates", "tigris", "atatürk barajı", "GAP"],
  },
  {
    id: "meric-ergene",
    name: "Meriç-Ergene Havzası",
    shortName: "Meriç-Ergene",
    countries: ["Türkiye", "Bulgaristan", "Yunanistan"],
    center: { lat: 41.7, lon: 26.3 },
    floodPoints: [
      { lat: 41.67, lon: 26.56, name: "Edirne" },
      { lat: 41.40, lon: 26.72, name: "Meriç-İpsala" },
    ],
    mapCenter: [41.5, 26.5],
    mapZoom: 8,
    boundary: [
      [42.3, 25.0], [42.5, 26.0], [42.3, 27.0], [42.0, 27.5],
      [41.5, 28.0], [41.0, 27.5], [40.8, 27.0], [40.8, 26.0],
      [41.0, 25.5], [41.5, 25.0], [42.3, 25.0],
    ],
    rivers: [
      { name: "Meriç", path: [[42.2, 25.5], [42.0, 26.0], [41.8, 26.3], [41.7, 26.5], [41.4, 26.7], [41.0, 26.5], [40.8, 26.4]] },
      { name: "Ergene", path: [[41.8, 27.5], [41.7, 27.0], [41.6, 26.8], [41.5, 26.6], [41.7, 26.5]] },
      { name: "Tunca", path: [[42.3, 25.8], [42.0, 26.2], [41.8, 26.4], [41.7, 26.5]] },
    ],
    dams: [
      { name: "Süloğlu Barajı", lat: 41.78, lng: 26.90, river: "Ergene", capacity: "0.13 milyar m³", type: "Toprak dolgu" },
      { name: "Kayalıköy Barajı", lat: 41.85, lng: 27.15, river: "Ergene", capacity: "0.11 milyar m³", type: "Toprak dolgu" },
      { name: "Altınyazı Barajı", lat: 41.68, lng: 27.20, river: "Ergene", capacity: "0.18 milyar m³", type: "Toprak dolgu" },
    ],
    facts: [
      { label: "Havza", value: "Meriç-Ergene (Trakya)" },
      { label: "Paylaşan Ülkeler", value: "Türkiye, Bulgaristan, Yunanistan" },
      { label: "Havza Alanı", value: "≈ 53.000 km²" },
      { label: "Meriç Uzunluğu", value: "480 km" },
      { label: "Kritik Sorun", value: "Taşkın riski ve endüstriyel kirlilik" },
    ],
    rssKeywords: ["meriç", "ergene", "tunca", "edirne taşkın", "maritsa", "evros"],
  },
  {
    id: "coruh",
    name: "Çoruh Havzası",
    shortName: "Çoruh",
    countries: ["Türkiye", "Gürcistan"],
    center: { lat: 40.9, lon: 41.2 },
    floodPoints: [
      { lat: 41.18, lon: 41.82, name: "Çoruh-Batum" },
      { lat: 40.85, lon: 41.50, name: "Artvin" },
    ],
    mapCenter: [40.9, 41.5],
    mapZoom: 8,
    boundary: [
      [41.5, 40.5], [41.7, 41.0], [41.6, 41.8], [41.3, 42.0],
      [40.8, 42.0], [40.3, 41.5], [40.2, 41.0], [40.3, 40.5],
      [40.6, 40.0], [41.0, 40.0], [41.5, 40.5],
    ],
    rivers: [
      { name: "Çoruh", path: [[40.3, 40.2], [40.5, 40.5], [40.7, 41.0], [40.8, 41.3], [40.9, 41.5], [41.1, 41.7], [41.3, 41.8], [41.6, 41.7]] },
    ],
    dams: [
      { name: "Deriner Barajı", lat: 41.07, lng: 41.37, river: "Çoruh", capacity: "1.97 milyar m³", type: "Çift eğrilikli beton kemer" },
      { name: "Borçka Barajı", lat: 41.33, lng: 41.68, river: "Çoruh", capacity: "0.42 milyar m³", type: "Beton ağırlık" },
      { name: "Muratlı Barajı", lat: 41.17, lng: 41.52, river: "Çoruh", capacity: "0.11 milyar m³", type: "Beton ağırlık" },
      { name: "Artvin Barajı", lat: 41.20, lng: 41.83, river: "Çoruh", capacity: "0.15 milyar m³", type: "Beton ağırlık" },
      { name: "Yusufeli Barajı", lat: 40.82, lng: 41.13, river: "Çoruh", capacity: "2.17 milyar m³", type: "Çift eğrilikli beton kemer" },
    ],
    facts: [
      { label: "Havza", value: "Çoruh (Doğu Karadeniz)" },
      { label: "Paylaşan Ülkeler", value: "Türkiye, Gürcistan" },
      { label: "Havza Alanı", value: "≈ 22.100 km²" },
      { label: "Çoruh Uzunluğu", value: "431 km" },
      { label: "Kritik Sorun", value: "Enerji üretimi ve sediman taşınımı" },
    ],
    rssKeywords: ["çoruh", "artvin", "yusufeli", "deriner", "coruh"],
  },
  {
    id: "aras",
    name: "Aras Havzası",
    shortName: "Aras",
    countries: ["Türkiye", "Ermenistan", "İran", "Azerbaycan"],
    center: { lat: 40.0, lon: 43.5 },
    floodPoints: [
      { lat: 39.92, lon: 44.58, name: "Aras-Iğdır" },
      { lat: 40.17, lon: 43.67, name: "Aras-Kars" },
    ],
    mapCenter: [40.0, 43.5],
    mapZoom: 7,
    boundary: [
      [41.0, 42.0], [41.3, 43.0], [41.0, 44.0], [40.5, 45.0],
      [40.0, 45.5], [39.5, 45.0], [39.0, 44.5], [39.0, 43.5],
      [39.3, 42.5], [39.8, 42.0], [41.0, 42.0],
    ],
    rivers: [
      { name: "Aras", path: [[39.9, 41.8], [40.0, 42.5], [40.1, 43.0], [40.0, 43.5], [39.9, 44.0], [39.8, 44.5], [39.7, 45.0], [39.6, 45.5]] },
    ],
    dams: [
      { name: "Çıldır Gölü", lat: 41.05, lng: 43.25, river: "Arpaçay", capacity: "1.4 milyar m³", type: "Doğal göl" },
      { name: "Kars Barajı", lat: 40.60, lng: 43.10, river: "Kars Çayı", capacity: "0.21 milyar m³", type: "Toprak dolgu" },
    ],
    facts: [
      { label: "Havza", value: "Aras (Doğu Anadolu)" },
      { label: "Paylaşan Ülkeler", value: "Türkiye, Ermenistan, İran, Azerbaycan" },
      { label: "Havza Alanı", value: "≈ 102.000 km²" },
      { label: "Aras Uzunluğu", value: "1.072 km" },
      { label: "Kritik Sorun", value: "Sınır anlaşmazlıkları ve tarımsal su kullanımı" },
    ],
    rssKeywords: ["aras", "araxes", "iğdır", "kars", "ermenistan su"],
  },
  {
    id: "kura",
    name: "Kura Havzası",
    shortName: "Kura",
    countries: ["Türkiye", "Gürcistan", "Azerbaycan"],
    center: { lat: 41.2, lon: 43.0 },
    floodPoints: [
      { lat: 41.23, lon: 43.60, name: "Kura-Ardahan" },
    ],
    mapCenter: [41.2, 43.5],
    mapZoom: 8,
    boundary: [
      [41.8, 42.5], [42.0, 43.0], [41.8, 43.8], [41.5, 44.0],
      [41.0, 43.8], [40.8, 43.2], [40.9, 42.5], [41.3, 42.2],
      [41.8, 42.5],
    ],
    rivers: [
      { name: "Kura", path: [[41.1, 42.7], [41.2, 43.0], [41.3, 43.3], [41.4, 43.6], [41.5, 44.0], [41.6, 44.5]] },
    ],
    dams: [
      { name: "Ardahan Barajı", lat: 41.12, lng: 42.70, river: "Kura", capacity: "0.05 milyar m³", type: "Toprak dolgu" },
    ],
    facts: [
      { label: "Havza", value: "Kura (Kuzeydoğu Anadolu)" },
      { label: "Paylaşan Ülkeler", value: "Türkiye, Gürcistan, Azerbaycan" },
      { label: "Havza Alanı", value: "≈ 188.000 km²" },
      { label: "Kura Uzunluğu", value: "1.515 km" },
      { label: "Kritik Sorun", value: "Su kalitesi ve sınır ötesi kirlilik" },
    ],
    rssKeywords: ["kura", "ardahan", "gürcistan su", "kur river", "mtkvari"],
  },
];

export function getBasinById(id: string): BasinConfig | undefined {
  return BASINS.find((b) => b.id === id);
}
