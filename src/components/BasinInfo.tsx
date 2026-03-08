import { MapPin, Waves, Mountain } from "lucide-react";

const BasinInfo = () => {
  const facts = [
    { icon: MapPin, label: "Havza", value: "Fırat-Dicle (Mezopotamya)" },
    { icon: Waves, label: "Ana Baraj", value: "Atatürk Barajı (Şanlıurfa)" },
    { icon: Mountain, label: "Havza Alanı", value: "≈ 879.790 km²" },
    { icon: Waves, label: "Fırat Uzunluğu", value: "2.800 km" },
    { icon: Waves, label: "Dicle Uzunluğu", value: "1.900 km" },
  ];

  return (
    <div className="space-y-3">
      {facts.map(({ icon: Icon, label, value }, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
        Veri kaynakları: Sentinel-2 (NDWI su maskeleme), CHIRPS (yağış), RSS/HTML haber akışları. 
        GEE backend entegrasyonu için Lovable Cloud kullanılabilir.
      </p>
    </div>
  );
};

export default BasinInfo;
