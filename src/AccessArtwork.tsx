import { useState } from "react";
import { campus, pointsString, type Layers } from "./model";
import { doorDescription, type Door } from "./access";
export function DoorGlyph({
  door,
  x,
  y,
  scale = 1,
  selected = false,
}: {
  door: Door;
  x: number;
  y: number;
  scale?: number;
  selected?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-door={door.id}>
      <title>{`${door.id}: ${doorDescription(door)}. ${door.note}`}</title>
      <circle
        r="8"
        fill={selected ? "#f6d66d" : "#f5f3ec"}
        stroke={selected ? "#173f35" : "none"}
        strokeWidth="2"
      />
      {door.motion === "sliding" ? (
        <g stroke="#166978" strokeWidth="1.8" fill="none">
          <path d="M-6 0H6M-6 0l3 -3M-6 0l3 3M6 0l-3 -3M6 0l-3 3M0 -4v8" />
        </g>
      ) : (
        <g
          transform={door.swing === "inward" ? "scale(1 -1)" : undefined}
          stroke={door.swing === "inward" ? "#76532d" : "#166978"}
          strokeWidth="1.5"
          fill="none"
        >
          <path
            d={
              door.leaves === 1
                ? "M-6 3V-5M-6 -5Q2 -5 2 3"
                : "M-6 3V-4M6 3V-4M-6 -4Q0 -4 0 3Q0 -4 6 -4"
            }
          />
          {door.swing === "both" && <path d="M-6 4Q0 11 6 4" />}
        </g>
      )}
    </g>
  );
}
export function FloorArtwork({
  floor,
  selectedDoor = null,
  onDoor,
  layers,
}: {
  floor: number;
  selectedDoor?: string | null;
  onDoor?: (id: string) => void;
  layers?: Layers;
}) {
  const plan = campus.access.floorPlans.find((p) => p.floor === floor)!;
  return (
    <>
      <defs>
        <clipPath id={`floor-walls-${floor}`}>
          {plan.footprints.map((b) => (
            <polygon key={b.buildingId} points={pointsString(b.polygon)} />
          ))}
        </clipPath>
      </defs>
      <rect x="0" y="15" width="460" height="145" fill="#f5f3ec" />
      {plan.footprints.map((b) => (
        <g key={b.buildingId}>
          <polygon
            points={pointsString(b.polygon)}
            fill="#d8b9a1"
            stroke="#9a7f68"
            strokeWidth="1.5"
          />
          <text
            x={b.buildingId === "G" ? 60 : 280}
            y="63"
            fontSize="15"
            fill="#493b30"
            fontWeight="700"
          >
            {b.buildingId}
          </text>
        </g>
      ))}
      {(layers?.walls ?? true) &&
        plan.walls.map((w, i) => (
          <polyline
            key={i}
            points={pointsString(w)}
            fill="none"
            clipPath={`url(#floor-walls-${floor})`}
            stroke="#8e2422"
            strokeWidth="1.8"
          />
        ))}
      {(layers?.corridors ?? true) && (
        <>
          <polyline
            points={pointsString(plan.corridor)}
            fill="none"
            stroke="#1b704c"
            strokeWidth="4"
          />
          <text x="205" y="148" textAnchor="middle" fontSize="9" fill="#183f35">
            Koridor G–H terhubung · posisi skematis
          </text>
        </>
      )}
      {(layers?.stairs ?? true) &&
        [plan.corridor[0], plan.corridor[1]].map((p, i) => (
          <g key={i} transform={`translate(${p[0]} ${p[1]})`}>
            <rect
              x="-10"
              y="-10"
              width="20"
              height="20"
              fill="#e4ece8"
              stroke="#183f35"
            />
            <path d="M-7 7h4V3h4V-1h4V-5h4" fill="none" stroke="#183f35" />
            <text
              x={i ? -12 : 12}
              y="24"
              textAnchor={i ? "end" : "start"}
              fontSize="8"
            >
              Tangga {i ? "H kanan" : "G kiri"}
            </text>
          </g>
        ))}
      {(layers?.doors ?? true) &&
        campus.access.doors
          .filter((d) => d.localPosition && d.floor === floor)
          .map((d) => (
            <g
              key={d.id}
              className="door-pick"
              role={onDoor ? "button" : undefined}
              tabIndex={onDoor ? 0 : undefined}
              aria-label={onDoor ? `${d.id}: ${doorDescription(d)}` : undefined}
              aria-pressed={onDoor ? selectedDoor === d.id : undefined}
              onClick={() => onDoor?.(d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDoor?.(d.id);
                }
              }}
            >
              <DoorGlyph
                door={d}
                x={d.localPosition![0]}
                y={d.localPosition![1]}
                scale={0.75}
                selected={selectedDoor === d.id}
              />
              <text
                x={d.localPosition![0]}
                y={
                  d.localPosition![1] +
                  (d.buildingId === "H" && floor === 1 ? -13 : 14)
                }
                textAnchor="middle"
                fontSize="6"
                fill="#183f35"
              >
                {d.id}
              </text>
            </g>
          ))}
    </>
  );
}
export function FloorPanel({
  floor,
  onFloor,
  selectedDoor,
  onDoor,
  layers,
}: {
  floor: number;
  onFloor: (n: number) => void;
  selectedDoor: string | null;
  onDoor: (id: string) => void;
  layers: Layers;
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <section className="floor-panel" aria-label="Denah lantai G–H">
      <div className="section-heading">
        <h2>Detail G–H</h2>
        <div className="view-switch">
          {[1, 2].map((n) => (
            <button
              key={n}
              aria-pressed={floor === n}
              onClick={() => onFloor(n)}
            >
              Lantai {n}
            </button>
          ))}
        </div>
      </div>
      <div className="floor-scroll">
        <svg
          aria-label={`Denah G–H lantai ${floor}`}
          viewBox="0 15 460 145"
          style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
        >
          <FloorArtwork
            floor={floor}
            selectedDoor={selectedDoor}
            onDoor={onDoor}
            layers={layers}
          />
        </svg>
      </div>
      <div className="playback">
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))}>
          Perbesar detail
        </button>
        <button onClick={() => setZoom(1)}>Reset detail</button>
      </div>
      <p className="small">
        Merah: batas ruang. Semua tanda cyan lantai 1 ditampilkan sebagai bukaan; H1-D01
        paling kanan satu daun, tiga pintu H lainnya dua daun membuka ke luar. Koridor dan tangga skematis, sambungan
        ruang yang belum jelas belum dirutekan.
      </p>
    </section>
  );
}
