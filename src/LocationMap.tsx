import { useEffect, useMemo, useRef, useState } from "react";
import L, { type LatLngBoundsExpression, type Map as LeafletMap } from "leaflet";
import { CircleMarker, MapContainer, Polygon, SVGOverlay, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapArtwork } from "./MapArtwork";
import { CompassRose } from "./CompassRose";
import { campus, type Layers, type Trace } from "./model";
import { aerialToCampus, type XY } from "./registration";
import { accuracyOutline, calibration, initialGeoPoints, locateOnCampus, saveGeoPoints, type GeoFix, type GeoPoint } from "./geo";

const [x, y, w, h] = campus.meta.viewBox;
const bounds: LatLngBoundsExpression = [[-y - h, x], [-y, x + w]];
const aerialMatrix = `matrix(${aerialToCampus().join(" ")})`;
const xy = (p: XY): [number, number] => [-p[1], p[0]];

function MapEvents({ onReady, capture, onCapture }: { onReady: (map: LeafletMap) => void; capture: boolean; onCapture: (point: XY) => void }) {
  const map = useMapEvents({ click(e) { if (capture) onCapture([e.latlng.lng, -e.latlng.lat]); } });
  useEffect(() => {
    onReady(map);
    map.fitBounds(bounds, { padding: [14, 14] });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, onReady]);
  return null;
}

function CalibrationPanel({ fix, points, setPoints, picked, setPicked, setCapture }: {
  fix: GeoFix | null; points: GeoPoint[]; setPoints: (points: GeoPoint[]) => void;
  picked: XY | null; setPicked: (point: XY | null) => void; setCapture: (value: boolean) => void;
}) {
  const [label, setLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  useEffect(() => {
    if (fix) { setLatitude(String(fix.latitude)); setLongitude(String(fix.longitude)); }
  }, [fix]);
  const lat = Number(latitude), lon = Number(longitude);
  const valid = picked && label.trim() && latitude.trim() && longitude.trim() &&
    Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180;
  return <div className="calibration-panel">
    <p>Tambahkan tiga titik acuan lagi yang tersebar di sekolah. Ketuk letaknya pada peta, lalu isi koordinat titik yang sama. Gunakan GPS hanya saat Anda benar-benar berada di titik tersebut.</p>
    <button type="button" aria-pressed={Boolean(picked)} onClick={() => { setPicked(null); setCapture(true); }}>Pilih titik pada peta</button>
    {picked && <p role="status">Titik denah: {picked.map((n) => n.toFixed(0)).join(", ")}</p>}
    <label>Nama patokan<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: sudut lapangan" /></label>
    <div className="geo-fields">
      <label>Lintang<input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></label>
      <label>Bujur<input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></label>
    </div>
    <button type="button" disabled={!valid} onClick={() => {
      const next = [...points, { id: crypto.randomUUID(), label: label.trim(), latitude: lat, longitude: lon, campus: picked! }];
      saveGeoPoints(next); setPoints(next); setPicked(null); setCapture(false); setLabel("");
    }}>Simpan titik acuan</button>
    <ul>{points.map((p, i) => <li key={p.id}>{i + 1}. {p.label}{i > 0 && <button type="button" aria-label={`Hapus ${p.label}`} onClick={() => {
      const next = points.filter((q) => q.id !== p.id); saveGeoPoints(next); setPoints(next);
    }}>Hapus</button>}</li>)}</ul>
  </div>;
}

export function LocationMap({ selected, selectedDoor, onDoor, onSelect, layers, traces, progress, activeTargets, staffOpened }: {
  selected: string | null; selectedDoor?: string | null; onDoor?: (id: string) => void;
  onSelect: (id: string) => void; layers: Layers; traces: Trace[]; progress: number;
  activeTargets?: string[]; staffOpened?: boolean;
}) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [base, setBase] = useState<"aerial" | "plan">("aerial");
  const [open, setOpen] = useState(false);
  const geoButton = useRef<HTMLButtonElement>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [capture, setCapture] = useState(false);
  const [picked, setPicked] = useState<XY | null>(null);
  const [points, setPoints] = useState<GeoPoint[]>(initialGeoPoints);
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [geoStatus, setGeoStatus] = useState("Lokasi belum diminta.");
  const [watchId, setWatchId] = useState<number | null>(null);
  const fitted = useMemo(() => calibration(points), [points]);
  const position = fix && fitted ? locateOnCampus(fix, fitted.matrix) : null;
  const inMap = position && position[0] >= x && position[0] <= x + w && position[1] >= y && position[1] <= y + h;
  useEffect(() => () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); }, [watchId]);
  function stopLocation() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setFix(null);
    setGeoStatus("Pemantauan lokasi dihentikan.");
  }
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stopLocation();
        setOpen(false);
        geoButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, watchId]);
  function startLocation() {
    setOpen(true);
    if (!navigator.geolocation) { setGeoStatus("GPS tidak tersedia pada browser ini."); return; }
    if (!window.isSecureContext) { setGeoStatus("GPS memerlukan HTTPS atau localhost."); return; }
    if (watchId !== null) return;
    setGeoStatus("Meminta izin lokasi perangkat…");
    const id = navigator.geolocation.watchPosition(
      (result) => { setFix({ latitude: result.coords.latitude, longitude: result.coords.longitude, accuracy: result.coords.accuracy }); setGeoStatus("Posisi diterima dari perangkat."); },
      (error) => {
        navigator.geolocation.clearWatch(id);
        setWatchId(null);
        setGeoStatus(error.code === 1 ? "Izin lokasi ditolak. Pilih gedung secara manual." : "Lokasi tidak tersedia. Coba lagi atau pilih gedung manual.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    setWatchId(id);
  }
  const outline = fix && fitted && inMap ? accuracyOutline(fix, fitted.matrix).map(xy) : [];
  return <div className="map2d leaflet-map2d">
    <MapContainer center={[-y - h / 2, x + w / 2]} zoom={-0.8} crs={L.CRS.Simple} minZoom={-2} maxZoom={2.5} zoomSnap={0.25} zoomControl={false} scrollWheelZoom={false} attributionControl={false} className="leaflet-campus">
      <MapEvents onReady={setMap} capture={capture} onCapture={(point) => { setPicked(point); setCapture(false); setOpen(true); }} />
      <SVGOverlay bounds={bounds} attributes={{ viewBox: `${x} ${y} ${w} ${h}`, class: "campus-map" }}>
        {base === "aerial" && <image href="./reference/udara-referensi.png" width="768" height="1376" transform={aerialMatrix} preserveAspectRatio="none" />}
        <g className={base === "aerial" ? "aerial-artwork" : undefined}>
          <MapArtwork selected={selected} selectedDoor={selectedDoor} onDoor={onDoor} onSelect={onSelect} layers={layers} traces={traces} progress={progress} activeTargets={activeTargets} staffOpened={staffOpened} interactive />
        </g>
      </SVGOverlay>
      {inMap && position && <>
        <Polygon positions={outline} pathOptions={{ color: "#075a83", fillColor: "#65d4ef", fillOpacity: 0.14, weight: 1.5 }} interactive={false} />
        <CircleMarker center={xy(position)} radius={8} pathOptions={{ color: "white", weight: 3, fillColor: "#006b96", fillOpacity: 1 }} interactive={false} />
      </>}
    </MapContainer>
    <div className="map-base-switch" role="group" aria-label="Latar peta">
      <button type="button" aria-pressed={base === "aerial"} onClick={() => setBase("aerial")}>Foto udara</button>
      <button type="button" aria-pressed={base === "plan"} onClick={() => setBase("plan")}>Denah</button>
    </div>
    <div className="map-tools" aria-label="Kontrol denah">
      <button aria-label="Perbesar peta" onClick={() => map?.zoomIn(0.5)}>+</button>
      <button aria-label="Perkecil peta" onClick={() => map?.zoomOut(0.5)}>−</button>
      <button aria-label="Geser peta ke kiri" onClick={() => map?.panBy([-60, 0])}>←</button>
      <button aria-label="Geser peta ke kanan" onClick={() => map?.panBy([60, 0])}>→</button>
      <button aria-label="Geser peta ke atas" onClick={() => map?.panBy([0, -60])}>↑</button>
      <button aria-label="Geser peta ke bawah" onClick={() => map?.panBy([0, 60])}>↓</button>
      <button className="reset" onClick={() => map?.fitBounds(bounds, { padding: [14, 14] })}>Reset</button>
    </div>
    <div className="compass-indicator" title="Arah perkiraan dari pencocokan denah dengan tangkapan Google Maps; belum diukur di lapangan">
      <CompassRose />
      <span>Arah perkiraan</span>
    </div>
    <div className="geo-control">
      <button ref={geoButton} className="geo-main-button" type="button" onClick={() => { if (open) { stopLocation(); setOpen(false); } else startLocation(); }} aria-expanded={open}>◎ Kamu sedang di sini</button>
      {open && <div className="geo-drawer">
        <div className="geo-drawer-heading"><strong>Posisi perangkat</strong><button type="button" onClick={() => { stopLocation(); setOpen(false); }} aria-label="Tutup panel lokasi">×</button></div>
        <p role="status">{geoStatus}</p>
        {fix && <p>Lintang {fix.latitude.toFixed(6)}, bujur {fix.longitude.toFixed(6)} · akurasi GPS ±{Math.round(fix.accuracy)} m.</p>}
        {!fitted && <p><strong>Penanda belum bisa ditempatkan pada denah.</strong> Baru {points.length} dari minimal 4 titik koordinat tersedia. Pilih gedung secara manual sampai kalibrasi diperiksa.</p>}
        {fitted && <p>Kalibrasi draf · selisih pencocokan {fitted.rmse.toFixed(1)} piksel denah. {inMap ? "Lingkaran menunjukkan akurasi GPS, bukan ketelitian denah." : "Posisi terukur berada di luar cakupan denah."}</p>}
        {inMap && position && <button type="button" onClick={() => map?.setView(xy(position), Math.max(map.getZoom(), -0.25))}>Lihat penanda di peta</button>}
        {watchId !== null && <button type="button" onClick={stopLocation}>Hentikan lokasi</button>}
        <button type="button" onClick={() => setCalibrating(!calibrating)} aria-expanded={calibrating}>{calibrating ? "Tutup kalibrasi" : "Kalibrasi peta"}</button>
        {calibrating && <CalibrationPanel fix={fix} points={points} setPoints={setPoints} picked={picked} setPicked={setPicked} setCapture={setCapture} />}
        <a href="https://www.google.com/maps/search/?api=1&query=-7.454896%2C112.398510" target="_blank" rel="noreferrer">Buka lokasi sekolah di Google Maps ↗</a>
        <p className="geo-caveat">Draf. GPS tidak menentukan ruang, lantai, atau jalur aman. Lokasi tetap di perangkat ini.</p>
      </div>}
    </div>
    <span className="map-scale">{base === "aerial" ? "Foto udara referensi" : "Denah skematis"} · tanpa skala ukur</span>
  </div>;
}
