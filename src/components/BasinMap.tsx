import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const damIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface DamLocation {
  name: string;
  lat: number;
  lng: number;
  river: string;
  capacity: string;
  type: string;
}

const DAMS: DamLocation[] = [
  { name: "Atatürk Barajı", lat: 37.4833, lng: 38.3167, river: "Fırat", capacity: "48.7 milyar m³", type: "Kaya dolgu" },
  { name: "Keban Barajı", lat: 38.8167, lng: 38.7500, river: "Fırat", capacity: "31.0 milyar m³", type: "Beton kemer" },
  { name: "Karakaya Barajı", lat: 38.2333, lng: 38.9500, river: "Fırat", capacity: "9.58 milyar m³", type: "Kaya dolgu" },
  { name: "Birecik Barajı", lat: 37.0333, lng: 37.9833, river: "Fırat", capacity: "1.22 milyar m³", type: "Beton ağırlık" },
  { name: "Ilısu Barajı", lat: 37.4500, lng: 41.7667, river: "Dicle", capacity: "10.4 milyar m³", type: "Beton ağırlık" },
  { name: "Dicle Barajı", lat: 37.9000, lng: 40.2333, river: "Dicle", capacity: "0.6 milyar m³", type: "Kaya dolgu" },
];

// Simplified Fırat-Dicle basin boundary (approximate)
const BASIN_BOUNDARY: [number, number][] = [
  [39.8, 36.0], [40.2, 37.5], [40.0, 39.0], [39.5, 40.5],
  [38.5, 41.5], [37.8, 42.5], [37.0, 43.5], [36.5, 44.0],
  [35.5, 44.5], [34.5, 44.0], [33.5, 43.5], [33.0, 42.0],
  [33.5, 40.5], [34.0, 39.0], [34.5, 38.0], [35.0, 37.0],
  [35.5, 36.5], [36.5, 36.0], [37.5, 35.5], [38.5, 35.5],
  [39.8, 36.0],
];

// Approximate Fırat river path
const FIRAT_RIVER: [number, number][] = [
  [39.7, 36.2], [39.5, 37.0], [39.0, 38.0], [38.8, 38.7],
  [38.2, 38.9], [37.5, 38.3], [37.0, 38.0], [36.5, 38.0],
  [36.0, 38.5], [35.5, 39.5], [34.5, 40.5], [33.5, 42.0],
  [33.0, 43.5],
];

// Approximate Dicle river path
const DICLE_RIVER: [number, number][] = [
  [38.5, 40.0], [38.0, 40.2], [37.9, 40.5], [37.5, 41.0],
  [37.4, 41.8], [37.0, 42.5], [36.5, 43.0], [35.5, 43.5],
  [34.5, 44.0], [33.5, 44.0], [33.0, 43.5],
];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(BASIN_BOUNDARY);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map]);
  return null;
}

const BasinMap = () => {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[37.5, 40.0]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds />

        {/* Basin boundary */}
        <Polygon
          positions={BASIN_BOUNDARY}
          pathOptions={{
            color: "hsl(210, 80%, 55%)",
            fillColor: "hsl(210, 80%, 55%)",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "8, 4",
          }}
        />

        {/* Fırat river */}
        <Polygon
          positions={FIRAT_RIVER}
          pathOptions={{
            color: "hsl(200, 70%, 50%)",
            weight: 3,
            fill: false,
          }}
        />

        {/* Dicle river */}
        <Polygon
          positions={DICLE_RIVER}
          pathOptions={{
            color: "hsl(200, 70%, 50%)",
            weight: 3,
            fill: false,
          }}
        />

        {/* Dam markers */}
        {DAMS.map((dam) => (
          <Marker key={dam.name} position={[dam.lat, dam.lng]} icon={damIcon}>
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">{dam.name}</p>
                <p>Nehir: {dam.river}</p>
                <p>Kapasite: {dam.capacity}</p>
                <p>Tip: {dam.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BasinMap;
