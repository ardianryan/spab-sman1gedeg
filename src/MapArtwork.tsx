import { DoorGlyph } from "./AccessArtwork";
import {
  campus,
  colors,
  pointsString,
  onTrace,
  defaultLayers,
  type Layers,
  type Trace,
} from "./model";
export function MapArtwork({
  selected = null,
  selectedDoor = null,
  onDoor,
  onSelect,
  layers = defaultLayers,
  traces = campus.referenceTraces,
  progress = 0,
  interactive = false,
  activeTargets = ["KU", "K1", "K2"],
  staffOpened = false,
}: {
  selected?: string | null;
  selectedDoor?: string | null;
  onDoor?: (id: string) => void;
  onSelect?: (id: string) => void;
  layers?: Layers;
  traces?: Trace[];
  progress?: number;
  interactive?: boolean;
  activeTargets?: string[];
  staffOpened?: boolean;
}) {
  return (
    <>
      <defs>
        <pattern
          id="unidentified"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 8L8 0" stroke="#c4c1b6" strokeWidth="1" />
        </pattern>
      </defs>
      <path
        d="M325 1028L716 1028L1007 79L880 142L881 177L974 179L1007 79 M325 1028L340 436"
        fill="#ecebe2"
        stroke="#b4b9aa"
        strokeWidth="2"
      />
      <path
        d="M315 376L974 0M381 378L982 36"
        fill="none"
        stroke="#d4d2c7"
        strokeWidth="5"
      />

      {campus.grounds.map((g) => (
        <g key={g.id}>
          <polygon
            points={pointsString(g.polygon)}
            fill={g.id === "upacara" ? colors.ground : "#e6e7d7"}
            stroke="#b3bda8"
            strokeWidth="2"
          />
          {g.id === "upacara" && (
            <path
              d="M508 550H720V696H508ZM614 550V696"
              fill="none"
              stroke="#f6f5ed"
              strokeWidth="2"
            />
          )}
          <text
            x={g.label[0]}
            y={g.label[1]}
            textAnchor="middle"
            fill="#405843"
            fontSize={g.id === "upacara" ? 19 : 12}
          >
            {g.name.split(" ").map((s, i) => (
              <tspan key={i} x={g.label[0]} dy={i ? 18 : 0}>
                {s}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      {layers.obstacles &&
        campus.obstacles.map((o) => (
          <g key={o.id} data-obstacle={o.id}>
            <polygon
              points={pointsString(o.polygon)}
              fill="#afc79b"
              stroke="#5b7848"
              strokeWidth="1.6"
            />
            <path
              d={`M${o.polygon[0][0] + 8} ${o.polygon[0][1] + 8}L${o.polygon[2][0] - 8} ${o.polygon[2][1] - 8}M${o.polygon[2][0] - 8} ${o.polygon[0][1] + 8}L${o.polygon[0][0] + 8} ${o.polygon[2][1] - 8}`}
              stroke="#688653"
              strokeWidth="1"
            />
            <text
              x={(o.polygon[0][0] + o.polygon[2][0]) / 2}
              y={(o.polygon[0][1] + o.polygon[2][1]) / 2 + 4}
              textAnchor="middle"
              fontSize="12"
              fill="#24462d"
            >
              Taman
            </text>
            <title>{`${o.name} — penghalang, bukan jalur berjalan`}</title>
          </g>
        ))}
      {layers.buildings && (
        <g>
          {campus.unidentified.map((b) => (
            <polygon
              key={b.id}
              points={pointsString(b.polygon)}
              fill="url(#unidentified)"
              stroke="#aaa99e"
              strokeWidth="1.5"
            />
          ))}
          {campus.buildings.map((b) => (
            <g
              key={b.id}
              className={`building ${selected === b.id ? "selected" : ""}`}
              role={interactive ? "button" : undefined}
              aria-label={interactive ? `Pilih gedung ${b.code}` : undefined}
              aria-pressed={interactive ? selected === b.id : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={() => onSelect?.(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(b.id);
                }
              }}
            >
              <title>{`Gedung ${b.code} — nama dan akses belum diverifikasi`}</title>
              <polygon
                points={pointsString(b.polygon)}
                fill={selected === b.id ? colors.selected : colors.building}
                stroke={selected === b.id ? colors.ink : "#a58870"}
                strokeWidth={selected === b.id ? 4 : 1.8}
              />
            </g>
          ))}
        </g>
      )}
      {layers.buildings &&
        campus.access.buildingParts.map((b) => (
          <g key={b.id} onClick={() => onSelect?.(b.buildingId)}>
            <polygon
              points={pointsString(b.polygon)}
              fill={
                selected === b.buildingId ? colors.selected : colors.building
              }
              stroke="#a58870"
              strokeWidth="1.8"
            />
            <text
              x="584"
              y="892"
              textAnchor="middle"
              fontSize="13"
              fill="#493b30"
            >
              O
            </text>
            <title>{b.name}</title>
          </g>
        ))}
      {layers.walls &&
        campus.access.walls.map((w, i) => (
          <polyline
            key={i}
            points={pointsString(w.points)}
            fill="none"
            stroke="#8e2422"
            strokeWidth="1.7"
          />
        ))}
      {layers.doors &&
        campus.access.doors
          .filter((d) => d.floor === 1)
          .map((d) => (
            <g
              key={d.id}
              className="building door-pick"
              role={onDoor ? "button" : undefined}
              aria-label={onDoor ? `Pilih pintu ${d.id}` : undefined}
              tabIndex={onDoor ? 0 : undefined}
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
                x={d.position[0]}
                y={d.position[1]}
                scale={0.8}
                selected={selectedDoor === d.id}
              />
            </g>
          ))}
      {layers.buildings && (
        <text
          x="790"
          y="522"
          textAnchor="middle"
          fill="#183f35"
          fontSize="12"
          fontWeight="700"
        >
          UKS
        </text>
      )}
      {layers.corridors &&
        activeTargets.includes("KU") &&
        campus.access.edges
          .filter((e) => e.id === "cross-road" || e.id === "gate-approach")
          .map((e) => (
            <polyline
              key={e.id}
              points={pointsString(e.points)}
              fill="none"
              stroke="#166978"
              strokeWidth="4"
              strokeDasharray="3 5"
            >
              <title>
                {e.kind === "crossing"
                  ? "Penyeberangan jalan menuju KU — skematis"
                  : "Akses gerbang kiri"}
              </title>
            </polyline>
          ))}
      {layers.stairs &&
        ["G", "H"].map((b) => {
          const n = campus.access.nodes.find((n) => n.id === `stair-${b}-1`)!;
          return (
            <g key={b} transform={`translate(${n.position.join(" ")})`}>
              <rect
                x="-9"
                y="-9"
                width="18"
                height="18"
                fill="#e4ece8"
                stroke="#183f35"
              />
              <path d="M-6 6h4V2h4V-2h4V-6" fill="none" stroke="#183f35" />
              <title>{`Tangga ${b === "G" ? "kiri G" : "kanan H"}`}</title>
            </g>
          );
        })}
      {layers.gates &&
        campus.access.gates.map((g) => (
          <g key={g.id} transform={`translate(${g.position.join(" ")})`}>
            <path
              d="M-12 -8v16M12 -8v16M-12 0h24"
              stroke={
                g.condition === "normal" || staffOpened ? "#166978" : "#875c20"
              }
              strokeWidth="4"
              strokeDasharray={
                g.condition === "staff-opened" && !staffOpened
                  ? "3 3"
                  : undefined
              }
            />
            <text
              x={g.id === "gate-left" ? -35 : 25}
              y={g.id === "gate-left" ? -25 : 50}
              textAnchor={g.id === "gate-left" ? "end" : "start"}
              fontSize="12"
              fill="#183f35"
            >
              {g.id === "gate-left"
                ? "Kiri · akses normal"
                : staffOpened
                  ? "Kanan · simulasi dibuka"
                  : "Kanan · perlu dibuka petugas"}
            </text>
          </g>
        ))}
      {layers.traces &&
        traces.map((t) => {
          const color = t.category === "utama" ? colors.main : colors.alternate;
          return (
            <g key={t.id} data-trace={t.id}>
              <polyline
                points={pointsString(t.points)}
                fill="none"
                stroke="#f5f3ec"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              <polyline
                points={pointsString(t.points)}
                fill="none"
                stroke={color}
                strokeWidth="3.5"
                strokeDasharray={
                  t.category === "alternatif" ? "9 6" : undefined
                }
                strokeLinejoin="round"
              />
              {[0.1, 0.4, 0.7, 0.98].map((p, i) => {
                const at = onTrace(t.points, (p + progress * 0.2) % 1);
                return (
                  <path
                    key={i}
                    d="M-5 -5L1 0L-5 5"
                    transform={`translate(${at.x} ${at.y}) rotate(${at.angle})`}
                    stroke={color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </g>
          );
        })}
      {layers.buildings &&
        campus.buildings.map((b) => (
          <g
            key={`label-${b.id}`}
            data-building-label={b.id}
            pointerEvents="none"
            transform={`translate(${b.label[0]} ${b.label[1]})`}
          >
            <rect
              x={b.id === "A1" ? -15 : -12}
              y="-14"
              width={b.id === "A1" ? 30 : 24}
              height="27"
              rx="3"
              fill={selected === b.id ? "#183f35" : "#f6eee3"}
              fillOpacity=".95"
            />
            <text
              textAnchor="middle"
              y="7"
              fontSize={b.id === "A1" ? 16 : 22}
              fontWeight="700"
              fill={selected === b.id ? "#fff" : "#493b30"}
            >
              {b.code}
            </text>
          </g>
        ))}
      {layers.destinations &&
        campus.destinations
          .filter(() => activeTargets.length > 0)
          .map((d) => (
            <g
              key={d.id}
              data-destination={d.id}
              data-active={activeTargets.includes(d.id)}
              transform={`translate(${d.position.join(" ")})`}
            >
              <rect
                x="-18"
                y="-18"
                width="36"
                height="36"
                rx="4"
                fill={activeTargets.includes(d.id) ? colors.ink : "#f5f3ec"}
                stroke={activeTargets.includes(d.id) ? "#fff" : colors.ink}
                strokeWidth="2"
              />
              <text
                textAnchor="middle"
                y="5"
                fill={activeTargets.includes(d.id) ? "white" : colors.ink}
                fontSize="14"
                fontWeight="700"
              >
                {d.id}
              </text>
              {d.role === "temporary" && (
                <text
                  textAnchor="middle"
                  y="31"
                  fontSize="11"
                  fill={colors.ink}
                >
                  Sementara
                </text>
              )}
              <title>{`${d.name}: ${d.role === "temporary" ? "sementara/alternatif saat akses padat atau terhalang" : "utama"}`}</title>
            </g>
          ))}
    </>
  );
}
