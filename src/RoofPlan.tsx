import { useState } from "react";
import data from "../data/roof-plan.json";
import { campus } from "./model";
import { composeAffine, invertAffine, project, registration, registrationFit, type XY } from "./registration";

export const roofPlan = data;
export type RoofBase = "clean" | "aerial" | "satellite";
const aerialFit = registrationFit("aerial");
const campusToAerial = composeAffine(invertAffine(aerialFit.matrix), registrationFit("campus").matrix);
const point = (p: number[], base: RoofBase): XY => base === "satellite" ? project(p as XY, aerialFit.matrix) : p as XY;
const shape = (points: number[][], base: RoofBase) => points.map((p) => point(p, base).join(",")).join(" ");
export const roofViewBox = (base: RoofBase) => base === "satellite" ? [0, 0, 669, 812] : [0, 0, 768, 1240];

export function RoofArtwork({ base = "clean", opacity = .7, labels = true, grounds = true, oldPlan = false, selected = null, onSelect }: {
  base?: RoofBase; opacity?: number; labels?: boolean; grounds?: boolean; oldPlan?: boolean;
  selected?: string | null; onSelect?: (id: string) => void;
}) {
  const label = (p: number[], text: string, size = 20) => {
    const [x, y] = point(p, base);
    return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#173e33" stroke="#fffdf5" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontSize={base === "satellite" ? size * .75 : size} fontWeight="700" pointerEvents="none">{text}</text>;
  };
  return <>
    <rect width="768" height="1376" fill="#f5f3ec" />
    {base === "aerial" && <image href={registration.aerial.path} width="768" height="1376" />}
    {base === "satellite" && <image href={registration.satellite.path} width="669" height="812" />}
    {grounds && roofPlan.grounds.map((g) => <g key={g.id}>
      <polygon points={shape(g.polygon, base)} fill={g.kind === "road" ? "#d5d4ce" : g.kind === "garden" ? "#73936a" : "#dbe6d3"} fillOpacity={base === "clean" ? 1 : .45} stroke="#637f61" strokeWidth="1.5" />
      {labels && (g.kind !== "field" ? label(g.labelPosition, g.label, 15) : <>
        {label(g.labelPosition, g.id, 22)}
        {label([g.labelPosition[0], g.labelPosition[1] + 22], g.id === "KU" ? "lapangan luar" : "sementara", 13)}
      </>)}
    </g>)}
    {roofPlan.roofs.map((r) => <g key={r.id} className={onSelect ? "roof-pick" : undefined} data-roof={r.id}
      role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `Atap ${r.label}` : undefined} aria-pressed={onSelect ? selected === r.id : undefined}
      onClick={onSelect ? () => onSelect(r.id) : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.id); } } : undefined}>
      <title>{`${r.label} · ${r.mappingStatus === "unassigned" ? "kode gedung belum diketahui" : "pencocokan kode sementara"}`}</title>
      <polygon points={shape(r.polygon, base)} fill={r.mappingStatus === "unassigned" ? "#b8b5a9" : "#c99978"}
        fillOpacity={base === "clean" ? 1 : opacity} stroke={selected === r.id ? "#173e33" : "#714b36"}
        strokeWidth={selected === r.id ? 4 : 1.8} strokeLinejoin="miter" />
      {labels && label(r.labelPosition, r.label, r.label.length > 7 ? 15 : 24)}
    </g>)}
    {oldPlan && <g data-old-roofs="true" fill="none" stroke="#185c83" strokeWidth="2" strokeDasharray="7 5" pointerEvents="none">
      {campus.buildings.map((b) => <polygon key={b.id} points={shape(b.polygon.map((p) => project(p as XY, campusToAerial)), base)} />)}
    </g>}
    <RoofCompass satellite={base === "satellite"} />
  </>;
}

function RoofCompass({ satellite }: { satellite: boolean }) {
  const inverse = invertAffine(aerialFit.matrix);
  const origin = project([0, 0], inverse);
  const directions = [["U", 0, -1], ["T", 1, 0], ["S", 0, 1], ["B", -1, 0]] as const;
  return <g transform="translate(58 64)" aria-label="Utara, timur, selatan, dan barat perkiraan">
    <rect x="-47" y="-50" width="94" height="110" rx="5" fill="#fffefa" fillOpacity=".95" />
    {directions.map(([name, x, y]) => {
      const p = satellite ? [x, y] : project([x, y], inverse).map((v, i) => v - origin[i]);
      const length = Math.hypot(...p), dx = p[0] / length, dy = p[1] / length;
      return <g key={name}>
        <line x1="0" y1="0" x2={dx * 24} y2={dy * 24} stroke={name === "U" ? "#a43f2a" : "#183f35"} strokeWidth={name === "U" ? 3 : 1.5} />
        <text x={dx * 36} y={dy * 36} textAnchor="middle" dominantBaseline="central" fill="#183f35" fontSize="13" fontWeight="700">{name}</text>
      </g>;
    })}
    <text y="52" textAnchor="middle" fontSize="10" fill="#183f35">Perkiraan</text>
  </g>;
}

export function RoofPlanPanel() {
  const [base, setBase] = useState<RoofBase>("clean");
  const [opacity, setOpacity] = useState(.65);
  const [labels, setLabels] = useState(true);
  const [grounds, setGrounds] = useState(true);
  const [oldPlan, setOldPlan] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const roof = roofPlan.roofs.find((r) => r.id === selected);
  return <section className="registration-panel roof-panel" aria-label="Draf denah hasil penelusuran atap">
    <div className="registration-controls">
      <h2>Denah hasil penelusuran atap</h2>
      <p>Draf baru dari tepi atap pada gambar udara. Bentuk dipasangkan dengan citra satelit menggunakan enam titik pencocokan visual.</p>
      <p className="notice"><strong>DRAF</strong> · Batas atap bukan batas dinding. Asal gambar udara belum terverifikasi sebagai foto drone asli.</p>
      <label htmlFor="roof-base">Latar pembanding</label>
      <select id="roof-base" value={base} onChange={(e) => { setBase(e.target.value as RoofBase); setZoom(1); }}>
        <option value="clean">Denah bersih</option><option value="aerial">Gambar udara</option><option value="satellite">Citra satelit</option>
      </select>
      <label htmlFor="roof-opacity">Ketampakan atap · {Math.round(opacity * 100)}%</label>
      <input id="roof-opacity" type="range" min="0" max="1" step=".05" value={opacity} disabled={base === "clean"} onChange={(e) => setOpacity(Number(e.target.value))} />
      <label><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} /> Label gedung dan area</label>
      <label><input type="checkbox" checked={grounds} onChange={(e) => setGrounds(e.target.checked)} /> Lapangan dan taman</label>
      <label><input type="checkbox" checked={oldPlan} onChange={(e) => setOldPlan(e.target.checked)} /> Bandingkan batas denah lama</label>
      {oldPlan && <p className="small">Garis biru putus-putus: tapak pada denah lama. Selisih dapat berasal dari teritisan, perspektif, atau bentuk denah lama.</p>}
      <label htmlFor="roof-select">Pilih atap untuk ditinjau</label>
      <select id="roof-select" value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)}>
        <option value="">Belum ada pilihan</option>
        {roofPlan.roofs.map((r) => <option key={r.id} value={r.id}>{r.label} · {r.id}</option>)}
      </select>
      <div role="status">{roof ? <><strong>{roof.label} · {roof.id}</strong><p>{roof.mappingStatus === "unassigned" ? "Kode gedung belum ditetapkan. ID ini hanya menandai objek penelusuran." : "Kode dipasangkan sementara berdasarkan posisi pada denah lama."} {roof.note}</p></> : <p>{roofPlan.roofs.length} bidang atap ditelusuri. Pilih bidang untuk melihat statusnya.</p>}</div>
      <p className="small">Atap A1 belum teridentifikasi pasti. D–E dan F–UKS tetap digabung pada bidang atapnya. Pintu dan jalur belum dipindahkan ke draf ini.</p>
      <a href="./exports/denah-atap.svg" download>Unduh denah atap · SVG</a>
      <a href="./exports/denah-atap.pdf" download>Unduh denah atap · PDF</a>
      <a href="./exports/denah-atap-data.json" download>Unduh data penelusuran · JSON</a>
    </div>
    <div className="roof-preview">
      <div className="roof-toolbar" role="group" aria-label="Pembesaran denah atap">
        <button onClick={() => setZoom((v) => Math.min(3, v + .5))} disabled={zoom >= 3}>Perbesar atap</button>
        <button onClick={() => setZoom((v) => Math.max(1, v - .5))} disabled={zoom <= 1}>Perkecil atap</button>
        <button onClick={() => setZoom(1)}>Reset atap</button>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div className="roof-scroll" tabIndex={0} aria-label="Area denah atap, gulir untuk melihat bagian yang diperbesar">
        <svg viewBox={roofViewBox(base).join(" ")} style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }} aria-label="Denah hasil penelusuran atap" className="roof-map">
          <RoofArtwork base={base} opacity={opacity} labels={labels} grounds={grounds} oldPlan={oldPlan} selected={selected} onSelect={setSelected} />
        </svg>
      </div>
      <p className="small">{base === "satellite" ? `Google Maps · tangkapan layar pengguna. Selisih pencocokan gambar udara: ${aerialFit.rmse.toFixed(1)} piksel citra; bukan akurasi GPS.` : "Koordinat piksel gambar udara. Ukuran, batas lahan, dan orientasi geografis belum diukur."}</p>
      <p className="small">Terakota: atap dengan kode sementara. Abu-abu: atap yang belum memiliki kode. Hijau: lapangan dan taman.</p>
    </div>
  </section>;
}
