import { useState } from "react";
import { campus, pointsString } from "./model";
import { geographicPreview } from "./geo";
import { RoofPlanPanel } from "./RoofPlan";
import {
  registration,
  registrationFit,
  project,
  type XY,
} from "./registration";
export function RegistrationArtwork({
  opacity = 0.5,
  overlay = "campus",
  showPoints = true,
  showGeographicPreview = false,
}: {
  opacity?: number;
  overlay?: "campus" | "aerial";
  showPoints?: boolean;
  showGeographicPreview?: boolean;
}) {
  const fit = registrationFit(overlay),
    denah = registrationFit("campus");
  const anchor = project(
    registration.anchor.campusPosition as XY,
    denah.matrix,
  );
  return (
    <>
      <image href={registration.satellite.path} width="669" height="812" />
      {overlay === "aerial" ? (
        <image
          href={registration.aerial.path}
          width="768"
          height="1376"
          transform={`matrix(${fit.matrix.join(" ")})`}
          opacity={opacity}
        />
      ) : (
        <g transform={`matrix(${fit.matrix.join(" ")})`} opacity={opacity}>
          {[
            ...campus.buildings,
            ...campus.access.buildingParts.map((b) => ({
              ...b,
              code: "O",
              label: [584, 889] as XY,
            })),
          ].map((b) => (
            <g key={b.id}>
              <polygon
                points={pointsString(b.polygon)}
                fill="#ffedab"
                fillOpacity=".35"
                stroke="#ffde5a"
                strokeWidth="3"
              />
              <text
                x={b.label[0]}
                y={b.label[1]}
                textAnchor="middle"
                fill="#fff"
                stroke="#183f35"
                paintOrder="stroke"
                strokeWidth="2"
                fontSize="18"
                fontWeight="700"
              >
                {b.code}
              </text>
            </g>
          ))}
        </g>
      )}
      {showPoints &&
        registration.controlPoints.map((p, i) => {
          const q = project(p[overlay] as XY, fit.matrix);
          return (
            <g key={p.id}>
              <path
                d={`M${q.join(" ")}L${p.satellite.join(" ")}`}
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={p.satellite[0]}
                cy={p.satellite[1]}
                r="6"
                fill="#ffd652"
                stroke="#172d27"
                strokeWidth="2"
              />
              <path
                d={`M${q[0] - 5} ${q[1]}h10M${q[0]} ${q[1] - 5}v10`}
                stroke="#75efff"
                strokeWidth="2"
              />
              <text
                x={p.satellite[0] + 10}
                y={p.satellite[1] - 8}
                fill="#fff"
                stroke="#162d26"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize="14"
              >
                {p.id} · {fit.residuals[i].toFixed(1)} px
              </text>
            </g>
          );
        })}
      <g transform={`translate(${anchor.join(" ")})`}>
        <circle r="10" fill="none" stroke="white" strokeWidth="3" />
        <circle r="3" fill="#fff" />
        <title>
          Tengah lapangan upacara — koordinat acuan pengguna; posisi piksel
          perkiraan
        </title>
      </g>
      {showGeographicPreview && geographicPreview()?.predictions.map((p, i) => {
        const [x, y] = project(p.projectedCampus, denah.matrix);
        return <g key={p.id} transform={`translate(${x} ${y})`}>
          <circle r="12" fill="white" fillOpacity=".8" stroke="#8a3c16" strokeWidth="2" strokeDasharray="3 2" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#64290d" fontWeight="700">{i + 1}</text>
          <title>{p.feature}: posisi hasil proyeksi sementara, belum dikonfirmasi</title>
        </g>;
      })}
      <rect x="0" y="779" width="669" height="33" fill="#172d27" />
      <text x="12" y="800" fill="white" fontSize="12">
        Google Maps · tangkapan layar pengguna · prapemetaan, bukan hasil survei
      </text>
    </>
  );
}
function ImageRegistrationPanel() {
  const [overlay, setOverlay] = useState<"campus" | "aerial">("campus"),
    [opacity, setOpacity] = useState(0.65),
    [points, setPoints] = useState(true);
  const [preview, setPreview] = useState(false);
  const geographic = geographicPreview();
  const fit = registrationFit(overlay);
  return (
    <section className="registration-panel" aria-label="Prapemetaan citra">
      <div className="registration-controls">
        <h2>Pencocokan citra</h2>
        <p>
          Denah dan gambar udara dipasangkan ke tangkapan layar Google Maps
          melalui enam titik yang dipilih manual.
        </p>
        <label htmlFor="overlay-source">Lapisan pembanding</label>
        <select
          id="overlay-source"
          value={overlay}
          onChange={(e) => setOverlay(e.target.value as "campus" | "aerial")}
        >
          <option value="campus">Denah vektor</option>
          <option value="aerial">Gambar udara referensi</option>
        </select>
        <label htmlFor="overlay-opacity">
          Ketampakan lapisan · {Math.round(opacity * 100)}%
        </label>
        <input
          id="overlay-opacity"
          type="range"
          min="0"
          max="1"
          step=".05"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
        />
        <label>
          <input
            type="checkbox"
            checked={points}
            onChange={(e) => setPoints(e.target.checked)}
          />{" "}
          Titik pencocokan dan selisih
        </label>
        <p>
          Lingkaran kuning: titik pada citra. Tanda silang biru: hasil
          transformasi.
        </p>
        <p>
          <strong>Selisih RMS: {fit.rmse.toFixed(1)} piksel.</strong> Ini
          selisih visual, bukan ukuran akurasi dalam meter.
        </p>
        <p>
          <strong>Tengah lapangan upacara</strong>
          <br />
          -7.454896, 112.398510
        </p>
        <a href={registration.mapsUrl} target="_blank" rel="noreferrer">
          Buka lokasi di Google Maps ↗
        </a>
        <p className="small">
          Koordinat acuan dikonfirmasi pengguna. Skala meter dan orientasi
          geografis belum dikalibrasi; pintu ditandai secara visual tanpa
          koordinat geografis, sesuai arahan pengguna.
        </p>
        {geographic && <div>
          <h3>Pratinjau geografis</h3>
          <p>{geographic.points.length} pasangan sementara: tengah lapangan upacara, gerbang kiri A1, dan bagian kiri bawah N.</p>
          <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Tampilkan proyeksi sudut yang belum pasti</label>
          <ol>{geographic.predictions.map((p) => <li key={p.id}>{p.feature}</li>)}</ol>
          <p className="small">Lingkaran putus-putus adalah perkiraan dari transformasi, bukan titik yang sudah dicocokkan. Tiga pasangan tidak memberi pengujian akurasi independen. Penanda GPS tetap menunggu kalibrasi yang lengkap.</p>
        </div>}
      </div>
      <div>
        <svg
          className="registration-map"
          viewBox="0 0 669 812"
          aria-label="Tumpang susun denah dan citra satelit"
        >
          <RegistrationArtwork
            opacity={opacity}
            overlay={overlay}
            showPoints={points}
            showGeographicPreview={preview}
          />
        </svg>
        <table>
          <caption>Titik kontrol sementara</caption>
          <thead>
            <tr>
              <th>Titik</th>
              <th>Objek</th>
              <th>Selisih</th>
            </tr>
          </thead>
          <tbody>
            {registration.controlPoints.map((p, i) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.feature}</td>
                <td>{fit.residuals[i].toFixed(1)} px</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <caption>Koordinat acuan dari pengguna</caption>
          <thead><tr><th>Patokan</th><th>Koordinat</th><th>Status pencocokan</th></tr></thead>
          <tbody>
            <tr><td>Tengah lapangan upacara</td><td>{registration.anchor.latitude}, {registration.anchor.longitude}</td><td>Posisi gambar perkiraan</td></tr>
            {registration.geographicControlPoints.map((point) => (
              <tr key={point.id}>
                <td>{point.feature}</td>
                <td>{point.latitude}, {point.longitude}</td>
                <td>{point.status === "pending-corner-confirmation" ? "Menunggu kepastian sudut pada gambar" : point.status === "provisional-image-match" ? "Pencocokan gambar sementara; belum dipakai untuk GPS" : "Menunggu pencocokan pada gambar"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small">{registration.geographicControlPoints.length + 1} koordinat telah diterima. Koordinat tambahan belum digunakan untuk penanda GPS sampai patokan yang sama dipastikan pada gambar.</p>
      </div>
    </section>
  );
}

export function RegistrationPanel() {
  const [tab, setTab] = useState<"images" | "roofs">("images");
  return <>
    <div className="registration-tabs" role="group" aria-label="Jenis prapemetaan">
      <button aria-pressed={tab === "images"} onClick={() => setTab("images")}>Pencocokan citra</button>
      <button aria-pressed={tab === "roofs"} onClick={() => setTab("roofs")}>Draf denah atap</button>
    </div>
    {tab === "images" ? <ImageRegistrationPanel /> : <RoofPlanPanel />}
  </>;
}
