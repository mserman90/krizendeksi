import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BasinConfig } from "@/lib/basinConfig";

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

interface Props {
  basin: BasinConfig;
}

function FitBounds({ boundary }: { boundary: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(boundary);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, boundary]);
  return null;
}

const BasinMap = ({ basin }: Props) => {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        key={basin.id}
        center={basin.mapCenter}
        zoom={basin.mapZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds boundary={basin.boundary} />

        <Polygon
          positions={basin.boundary}
          pathOptions={{
            color: "hsl(210, 80%, 55%)",
            fillColor: "hsl(210, 80%, 55%)",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "8, 4",
          }}
        />

        {basin.rivers.map((river) => (
          <Polyline
            key={river.name}
            positions={river.path}
            pathOptions={{
              color: "hsl(200, 70%, 50%)",
              weight: 3,
            }}
          />
        ))}

        {basin.dams.map((dam) => (
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
