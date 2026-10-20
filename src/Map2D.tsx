import { useRef, useState } from "react";
import { MapArtwork } from "./MapArtwork";
import { CompassRose } from "./CompassRose";
import { campus, type Layers, type Trace } from "./model";
export function Map2D({
  selected,
  selectedDoor,
  onDoor,
  onSelect,
  layers,
  traces,
  progress,
  activeTargets,
  staffOpened,
}: {
  selected: string | null;
  selectedDoor?: string | null;
  onDoor?: (id: string) => void;
  onSelect: (id: string) => void;
  layers: Layers;
  traces: Trace[];
  progress: number;
  activeTargets?: string[];
  staffOpened?: boolean;
}) {
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
      null,
    ),
    svg = useRef<SVGSVGElement>(null);
  const [x, y, w, h] = campus.meta.viewBox;
  return (
    <div className="map2d">
      <svg
        ref={svg}
        className="campus-map"
        viewBox={`${x + (w - w / zoom) / 2 - pan.x} ${y + (h - h / zoom) / 2 - pan.y} ${w / zoom} ${h / zoom}`}
        aria-label="Denah sekolah. Pilih gedung melalui label atau daftar."
        onPointerDown={(e) => {
          if ((e.target as Element).closest(".building")) return;
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !svg.current) return;
          const rect = svg.current.getBoundingClientRect(),
            scale = Math.max(w / zoom / rect.width, h / zoom / rect.height);
          setPan({
            x: Math.max(-w, Math.min(w, drag.current.px + (e.clientX - drag.current.x) * scale)),
            y: Math.max(-h, Math.min(h, drag.current.py + (e.clientY - drag.current.y) * scale)),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <MapArtwork
          selected={selected}
          selectedDoor={selectedDoor}
          onDoor={onDoor}
          onSelect={onSelect}
          layers={layers}
          traces={traces}
          progress={progress}
          activeTargets={activeTargets}
          staffOpened={staffOpened}
          interactive
        />
      </svg>
      <div className="map-tools" aria-label="Kontrol denah">
        <button aria-label="Perbesar peta" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
        <button aria-label="Perkecil peta" onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>−</button>
        <button aria-label="Geser peta ke kiri" onClick={() => setPan((p) => ({ ...p, x: p.x + 60 / zoom }))}>←</button>
        <button aria-label="Geser peta ke kanan" onClick={() => setPan((p) => ({ ...p, x: p.x - 60 / zoom }))}>→</button>
        <button aria-label="Geser peta ke atas" onClick={() => setPan((p) => ({ ...p, y: p.y + 60 / zoom }))}>↑</button>
        <button aria-label="Geser peta ke bawah" onClick={() => setPan((p) => ({ ...p, y: p.y - 60 / zoom }))}>↓</button>
        <button className="reset" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
      </div>
      <div className="compass-indicator" title="Arah perkiraan dari pencocokan denah dengan tangkapan Google Maps; belum diukur di lapangan">
        <CompassRose />
        <span>Arah perkiraan</span>
      </div>
      <span className="map-scale">{Math.round(zoom * 100)}% · Geometri ilustratif, tanpa skala ukur</span>
    </div>
  );
}
