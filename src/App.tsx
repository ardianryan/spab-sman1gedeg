import { RegistrationPanel } from "./RegistrationPanel";
import { FloorPanel } from "./AccessArtwork";
import { activeDestinations, doorDescription, type Condition } from "./access";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  campus,
  defaultLayers,
  routesFor,
  type Layers,
  type Trace,
} from "./model";
import { Map2D } from "./Map2D";
import { LocationMap } from "./LocationMap";
const Map3D = lazy(() => import("./Map3D"));
const exportsList = [
  ["Draf denah atap", "denah-atap.pdf", "PDF · penelusuran atap"],
  ["Atap dan citra satelit", "denah-atap-satelit.pdf", "PDF · pembanding"],
  ["Prapemetaan citra", "prapemetaan.pdf", "PDF · pencocokan sementara"],
  ["Data pencocokan", "prapemetaan-data.json", "JSON · titik dan transformasi"],
  ["Detail G–H lantai 1", "gh-lantai-1.pdf", "PDF · pintu dan koridor"],
  ["Detail G–H lantai 2", "gh-lantai-2.pdf", "PDF · pintu dan koridor"],
  ["Peta A3", "peta-a3.pdf", "PDF · cetak besar"],
  ["Peta A4", "peta-a4.pdf", "PDF · cetak dokumen"],
  ["Denah vektor", "peta.svg", "SVG · dapat disunting"],
  ["Peta gambar", "peta.png", "PNG · presentasi"],
  ["Video utama", "sosialisasi-utama.mp4", "MP4 · 2 menit"],
  ["Video vertikal", "sosialisasi-vertikal.mp4", "MP4 · 50 detik"],
  ["Takarir utama", "sosialisasi-utama.srt", "SRT · bahasa Indonesia"],
  ["Takarir vertikal", "sosialisasi-vertikal.srt", "SRT · bahasa Indonesia"],
  ["Naskah video", "naskah-video.txt", "TXT · tanpa narasi suara"],
  ["Lembar verifikasi", "lembar-verifikasi.csv", "CSV · untuk tim sekolah"],
];
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setIsClosing(true);
    timer.current = setTimeout(onClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160);
  }
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement;
    const bodyOverflow = document.body.style.overflow;
    const bodyPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    d?.showModal();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      d?.close();
      document.body.style.overflow = bodyOverflow;
      document.body.style.paddingRight = bodyPadding;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={isClosing ? "is-closing" : undefined}
      onCancel={(e) => { e.preventDefault(); requestClose(); }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      aria-labelledby="dialog-title"
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        <button type="button" onClick={requestClose} aria-label="Tutup dialog">
          ×
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export default function App() {
  const [selected, setSelected] = useState<string | null>(null),
    [scenarioId, setScenario] = useState("reference"),
    [view, setView] = useState<"2d" | "location" | "3d" | "registration">("2d"),
    [layers, setLayers] = useState<Layers>(defaultLayers),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [playing, setPlaying] = useState(false),
    [progress, setProgress] = useState(0),
    [epoch, setEpoch] = useState(0),
    [dialog, setDialog] = useState<"downloads" | "sources" | "guide" | null>(
      null,
    );
  const [floor, setFloor] = useState(1);
  const [selectedDoor, setSelectedDoor] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("normal");
  const [staffOpened, setStaffOpened] = useState(false);
  const activeTargets = activeDestinations(scenarioId, condition);
  function chooseDoor(id: string) {
    const d = campus.access.doors.find((d) => d.id === id)!;
    setSelected(d.buildingId);
    setFloor(d.floor);
    setSelectedDoor(id);
  }
  useEffect(() => {
    setSelectedDoor((id) =>
      campus.access.doors.some(
        (d) => d.id === id && d.buildingId === selected && d.floor === floor,
      )
        ? id
        : null,
    );
  }, [selected, floor]);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)"),
      fn = () => {
        setReduced(media.matches);
        if (media.matches) setPlaying(false);
      };
    media.addEventListener("change", fn);
    return () => media.removeEventListener("change", fn);
  }, []);
  const scenario = campus.scenarios.find((s) => s.id === scenarioId)!;
  const building = campus.buildings.find((b) => b.id === selected);
  const routes = routesFor(campus, selected, scenarioId);
  const traces = useMemo<Trace[]>(
    () =>
      scenarioId === "reference"
        ? campus.referenceTraces.filter(
            (t) => filter === "all" || t.category === filter,
          )
        : routes.map((r) => ({
            id: r.id,
            name: r.id,
            category: r.category,
            source: r.source,
            verified: r.verified,
            originBuildingId: r.originBuildingId,
            destinationId: r.destinationId,
            points: r.nodeIds.map(
              (id) => campus.accessNodes.find((n) => n.id === id)!.position,
            ),
          })),
    [scenarioId, filter, selected],
  );
  const effectivePlay =
    playing && !reduced && layers.traces && traces.length > 0;
  useEffect(() => {
    if (!effectivePlay || (view !== "2d" && view !== "location")) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      setProgress((p) => p + dt / 5000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [effectivePlay, view]);
  function changeScenario(id: string) {
    setScenario(id);
    setPlaying(false);
    setProgress(0);
    setEpoch((n) => n + 1);
  }
  const buildings = campus.buildings.filter((b) =>
    `${b.code} ${b.name ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <a className="skip-link" href="#controls">
        Lewati ke pilihan gedung
      </a>
      <header className="app-header">
        <div className="identity">
          <img
            className="school-logo"
            src="./brand/logo-sman-1-gedeg.png"
            alt="Logo SMA Negeri 1 Gedeg"
            width="52"
            height="52"
          />
          <div>
            <strong>SMAN 1 Gedeg</strong>
            <span>Satuan Pendidikan Aman Bencana</span>
          </div>
        </div>
        <nav aria-label="Menu utama">
          <button
            onClick={(e) => {
              e.currentTarget.focus();
              setDialog("guide");
            }}
          >
            Cara membaca
          </button>
          <button
            onClick={(e) => {
              e.currentTarget.focus();
              setDialog("sources");
            }}
          >
            Sumber & verifikasi
          </button>
          <button
            className="download-button"
            onClick={(e) => {
              e.currentTarget.focus();
              setDialog("downloads");
            }}
          >
            Unduh media <span aria-hidden="true">↓</span>
          </button>
        </nav>
      </header>
      <div className="draft-banner">
        <strong>DRAF</strong>
        <span>Belum diverifikasi untuk penggunaan operasional</span>
        <span className="version">
          v{campus.meta.version.replace("-draft", "")} · 20 Oktober 2026
        </span>
      </div>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">KENALI LINGKUNGAN SEKOLAH</p>
            <h1>Peta kesiapsiagaan</h1>
            <p>
              Telusuri gedung, kenali titik kumpul, dan tinjau jejak evakuasi.
            </p>
          </div>
          <div className="view-switch" role="group" aria-label="Tampilan peta">
            <button aria-pressed={view === "2d"} onClick={() => setView("2d")}>
              Denah 2D
            </button>
            <button aria-pressed={view === "location"} onClick={() => setView("location")}>
              Peta lokasi
            </button>
            <button
              aria-pressed={view === "registration"}
              onClick={() => setView("registration")}
            >
              Prapemetaan citra
            </button>
            <button aria-pressed={view === "3d"} onClick={() => setView("3d")}>
              Model 3D
            </button>
          </div>
        </div>
        {view === "registration" ? (
          <RegistrationPanel />
        ) : (
          <div className="workspace">
            <section className="map-panel" aria-label="Peta interaktif">
              <div className="map-topline">
                <span>
                  <i /> {scenario.name}
                </span>
                <span>
                  {view === "2d" ? "TAMPAK ATAS" : view === "location" ? "FOTO UDARA LOKAL" : "MODEL ILUSTRATIF"}
                </span>
              </div>
              <div className="map-area">
                {view === "2d" ? (
                  <Map2D
                    selected={selected}
                    selectedDoor={selectedDoor}
                    onDoor={chooseDoor}
                    onSelect={setSelected}
                    layers={layers}
                    traces={traces}
                    progress={progress}
                    activeTargets={activeTargets}
                    staffOpened={staffOpened}
                  />
                ) : view === "location" ? (
                  <LocationMap
                    selected={selected}
                    selectedDoor={selectedDoor}
                    onDoor={chooseDoor}
                    onSelect={setSelected}
                    layers={layers}
                    traces={traces}
                    progress={progress}
                    activeTargets={activeTargets}
                    staffOpened={staffOpened}
                  />
                ) : (
                  <Suspense
                    fallback={<div className="map-error">Memuat model 3D…</div>}
                  >
                    <Map3D
                      onDoor={chooseDoor}
                      floor={floor}
                      selectedDoor={selectedDoor}
                      activeTargets={activeTargets}
                      staffOpened={staffOpened}
                      selected={selected}
                      onSelect={setSelected}
                      layers={layers}
                      traces={traces}
                      playing={effectivePlay}
                      epoch={epoch}
                      onFallback={() => setView("2d")}
                    />
                  </Suspense>
                )}
                {view !== "location" && <div className="map-note">
                  <span className="note-number">01</span>
                  <div>
                    <strong>
                      {selected
                        ? `Gedung ${selected} dipilih`
                        : "Mulai dari sebuah gedung"}
                    </strong>
                    <p>
                      {selected
                        ? "Lihat status akses pada panel informasi."
                        : "Ketuk label pada peta atau pilih dari daftar."}
                    </p>
                  </div>
                </div>}
              </div>
              <div className="map-bottom">
                <div className="legend">
                  <span>
                    <i className="line main" />
                    Jejak utama
                  </span>
                  <span>
                    <i className="line alternate" />
                    Jejak alternatif
                  </span>
                  <span>
                    <i className="key">K</i>Tujuan sesuai konteks
                  </span>
                </div>
                <p>
                  Garis disalin dari denah lama. Akses dari gedung belum
                  terverifikasi.
                </p>
              </div>
              {building && ["G", "H"].includes(building.id) && (
                <FloorPanel
                  floor={floor}
                  onFloor={(n) => {
                    setFloor(n);
                    setSelectedDoor(null);
                  }}
                  selectedDoor={selectedDoor}
                  onDoor={chooseDoor}
                  layers={layers}
                />
              )}
            </section>
            <aside id="controls" className="controls">
              <section>
                <label className="section-label" htmlFor="scenario">
                  Konteks peninjauan
                </label>
                <select
                  id="scenario"
                  value={scenarioId}
                  onChange={(e) => changeScenario(e.target.value)}
                >
                  {campus.scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {scenarioId !== "reference" && (
                  <p className="scenario-note" role="status">
                    {scenario.instruction}
                  </p>
                )}
              </section>
              <section>
                <label className="section-label" htmlFor="condition">
                  Kondisi simulasi
                </label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => {
                    setCondition(e.target.value as Condition);
                    setPlaying(false);
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="crowded">Akses keluar padat</option>
                  <option value="blocked">Akses keluar terhalang</option>
                </select>
                <p className="small">
                  Untuk peninjauan, bukan informasi keadaan langsung.
                </p>
                <p role="status">
                  {scenarioId === "wind"
                    ? "Ruang perlindungan belum ditentukan."
                    : condition === "normal"
                      ? "KU · lapangan utama di luar gerbang. K1/K2 tetap ditampilkan sebagai titik sementara/alternatif. Akses KU melalui gerbang kiri dan penyeberangan jalan."
                      : "K1 dan K2 · pilihan titik sementara. Alokasi gedung dan kapasitas belum ditetapkan."}
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={staffOpened}
                    onChange={(e) => setStaffOpened(e.target.checked)}
                  />{" "}
                  Simulasikan gerbang kanan dibuka petugas
                </label>
                <p className="small">
                  Sambungan gerbang kanan ke luar sekolah belum dipetakan.
                </p>
              </section>
              <section>
                <div className="section-heading">
                  <h2>Lokasi awal</h2>
                  <span>{campus.buildings.length} kode gedung</span>
                </div>
                <label className="sr-only" htmlFor="search">
                  Cari kode gedung
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="Cari kode gedung, misalnya B"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="building-grid">
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      aria-label={`Gedung ${b.code}`}
                      aria-pressed={selected === b.id}
                      onClick={() => setSelected(b.id)}
                    >
                      {b.code}
                    </button>
                  ))}
                </div>
                {!buildings.length && (
                  <p role="status">Kode tidak ditemukan. Coba A, B, atau A1.</p>
                )}
              </section>
              <section className="selection-details" aria-live="polite">
                <div className="detail-heading">
                  <span className="building-code">{building?.code ?? "—"}</span>
                  <div>
                    <h2>
                      {building
                        ? `Gedung ${building.code}`
                        : "Belum ada lokasi"}
                    </h2>
                    <span>
                      {building
                        ? (building.name ?? "Nama gedung belum dicocokkan")
                        : "Pilih kode pada peta atau daftar"}
                    </span>
                  </div>
                  {selected && (
                    <button
                      className="clear"
                      aria-label="Hapus pilihan gedung"
                      onClick={() => setSelected(null)}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="status-detail">
                  <i />
                  <strong>
                    {routes.length
                      ? "Rute yang tercatat"
                      : "Rute belum tersedia"}
                  </strong>
                </div>
                <p>
                  {building
                    ? campus.access.policies.find(
                        (p) => p.buildingId === building.id,
                      )?.description
                    : "Peta ini memperlihatkan lokasi dan jejak referensi untuk peninjauan bersama tim sekolah."}
                </p>
                {building && (
                  <div className="door-list">
                    {campus.access.doors
                      .filter(
                        (d) =>
                          d.buildingId === building.id &&
                          (["G", "H"].includes(building.id)
                            ? d.floor === floor
                            : true),
                      )
                      .map((d) => (
                        <button
                          key={d.id}
                          aria-pressed={selectedDoor === d.id}
                          onClick={() => chooseDoor(d.id)}
                        >
                          <strong>{d.id}</strong>
                          <span>{doorDescription(d)}</span>
                          {d.note && <small>{d.note}</small>}
                        </button>
                      ))}
                    {building.id !== "A1" &&
                      !campus.access.doors.some(
                        (d) => d.buildingId === building.id,
                      ) && (
                        <p>
                          Jenis pintu tercatat; jumlah dan posisi bukaan belum
                          tersedia.
                        </p>
                      )}
                    {selectedDoor && (
                      <p role="status">
                        {selectedDoor}: posisi skematis. Hubungan ruang–koridor
                        belum lengkap; rute dari pintu ini belum tersedia.
                      </p>
                    )}
                    {building.id === "A1" && (
                      <p>
                        Area terbuka → gerbang kiri → menyeberang jalan → KU.
                        Gerbang kanan bersyarat dan belum memiliki sambungan
                        luar yang tercatat.
                      </p>
                    )}
                  </div>
                )}

                {routes.map((r) => (
                  <p key={r.id}>
                    Jalur {r.category} →{" "}
                    {
                      campus.destinations.find((d) => d.id === r.destinationId)
                        ?.name
                    }
                  </p>
                ))}
              </section>
              <section>
                <div className="section-heading">
                  <h2>Animasi jejak</h2>
                  <span>Untuk peninjauan</span>
                </div>
                <label className="sr-only" htmlFor="trace-filter">
                  Jenis jejak
                </label>
                <select
                  id="trace-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  disabled={scenarioId !== "reference"}
                >
                  <option value="all">Semua jejak referensi</option>
                  <option value="utama">Jejak utama · garis utuh</option>
                  <option value="alternatif">
                    Jejak alternatif · garis putus
                  </option>
                </select>
                <div className="playback">
                  <button
                    className="primary"
                    disabled={!traces.length || !layers.traces || reduced}
                    onClick={() => setPlaying(!playing)}
                  >
                    {effectivePlay ? "Ⅱ Jeda animasi" : "▷ Putar animasi"}
                  </button>
                  <button
                    onClick={() => {
                      setProgress(0);
                      setEpoch((n) => n + 1);
                      setPlaying(false);
                    }}
                  >
                    Ulangi
                  </button>
                </div>
                {reduced && (
                  <p className="small">
                    Gerakan dikurangi mengikuti pengaturan perangkat.
                  </p>
                )}
              </section>
              <section>
                <h2 className="section-label">Lapisan peta</h2>
                <div className="layer-list">
                  {(
                    [
                      ["buildings", "Bangunan"],
                      ["doors", "Pintu"],
                      ["obstacles", "Taman / penghalang"],
                      ["walls", "Batas ruang"],
                      ["corridors", "Koridor dan penyeberangan"],
                      ["stairs", "Tangga"],
                      ["gates", "Gerbang"],
                      ["destinations", "Titik kumpul"],
                      ["traces", "Jejak referensi"],
                      ["facilities", "Fasilitas keselamatan"],
                      ["hazards", "Catatan bahaya"],
                    ] as const
                  ).map(([key, name]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={layers[key]}
                        onChange={(e) =>
                          setLayers((l) => ({ ...l, [key]: e.target.checked }))
                        }
                      />
                      <span>{name}</span>
                      {(key === "facilities" || key === "hazards") && (
                        <small>data teks</small>
                      )}
                    </label>
                  ))}
                </div>
                {(layers.facilities || layers.hazards) && (
                  <div className="inventory">
                    <p>
                      Posisi belum diketahui; penanda tidak ditempatkan pada
                      peta.
                    </p>
                    {layers.facilities &&
                      campus.facilities.map((f) => (
                        <p key={f.id}>
                          <strong>
                            {f.name} · {f.quantity}
                          </strong>
                          <br />
                          {f.locationText}
                        </p>
                      ))}
                    {layers.hazards &&
                      campus.hazards.map((h) => (
                        <p key={h.id}>
                          <strong>{h.name}</strong>
                          <br />
                          {h.locationText}
                        </p>
                      ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}
        <section className="review-strip">
          <div>
            <span className="eyebrow">SEBELUM DIGUNAKAN</span>
            <h2>Lengkapi peta bersama tim sekolah.</h2>
          </div>
          <p>
            Nama gedung, akses keluar, tujuan setiap jalur, dan SOP masih perlu
            dikonfirmasi.
          </p>
          <button
            onClick={(e) => {
              e.currentTarget.focus();
              setDialog("sources");
            }}
          >
            Lihat catatan verifikasi →
          </button>
        </section>
        <section className="faq" aria-labelledby="faq-heading">
          <p className="eyebrow">PERTANYAAN UMUM</p>
          <h2 id="faq-heading">Tentang peta evakuasi</h2>
          <div className="faq-grid">
            <div><h3>Apakah jalur ini sudah dapat digunakan saat bencana?</h3><p>Belum. Peta ini merupakan draf untuk peninjauan. Jalur dan prosedur masih memerlukan verifikasi sekolah.</p></div>
            <div><h3>Di mana titik kumpul yang ditampilkan?</h3><p>KU ditandai di lapangan luar gerbang utama. K1 dan K2 ditampilkan sebagai titik kumpul sementara atau alternatif. Penggunaannya bergantung pada skenario dan kondisi akses.</p></div>
            <div><h3>Apakah GPS menentukan jalur evakuasi saya?</h3><p>Tidak. GPS hanya memperkirakan posisi perangkat. Penanda pada denah menunggu kalibrasi dengan beberapa titik acuan.</p></div>
          </div>
        </section>
      </main>
      <footer>
        <span>SPAB / SMAN 1 Gedeg</span>
        <span>GPS tersedia setelah izin perangkat · Penanda denah menunggu kalibrasi</span>
        <span><a href="https://github.com/ardianryan/spab-sman1gedeg" target="_blank" rel="noreferrer">Kode sumber</a> · <a href="https://github.com/ardianryan/spab-sman1gedeg/blob/main/LICENSE" target="_blank" rel="noreferrer">GNU AGPLv3</a></span>
      </footer>
      {dialog === "downloads" && (
        <Dialog title="Media untuk ditinjau" onClose={() => setDialog(null)}>
          <p>
            Semua media berstatus draf dan menggunakan denah induk versi{" "}
            {campus.meta.version}.
          </p>
          <div className="download-list">
            {exportsList.map(([title, file, format]) => (
              <a key={file} href={`./exports/${file}`} download>
                <span>
                  <strong>{title}</strong>
                  <small>{format}</small>
                </span>
                <span aria-hidden="true">↓</span>
              </a>
            ))}
          </div>
        </Dialog>
      )}
      {dialog === "sources" && (
        <Dialog
          title="Sumber & status verifikasi"
          onClose={() => setDialog(null)}
        >
          <p className="notice">
            Belum ada rute yang disahkan untuk penggunaan operasional.
          </p>
          <h3>Yang masih perlu diperiksa</h3>
          <ol>
            {campus.uncertainties.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ol>
          <h3>Sumber yang digunakan</h3>
          {campus.sources.map((s) => (
            <div className="source" key={s.id}>
              <strong>{s.name}</strong>
              <p>{s.note}</p>
            </div>
          ))}
          <a
            href="./reference/denah-sumber.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Buka denah sumber ↗
          </a>
          <p className="small">
            Tujuh potongan garis pada aplikasi merupakan penelusuran visual,
            bukan jumlah rute resmi. Dokumen menyebut lima jalur; pencocokannya
            belum selesai.
          </p>
        </Dialog>
      )}
      {dialog === "guide" && (
        <Dialog title="Cara membaca peta" onClose={() => setDialog(null)}>
          <ol className="guide">
            <li>
              <strong>Pilih gedung.</strong>
              <p>
                Kode mengikuti denah lama. Pintu yang ditandai dilengkapi jenis
                dan arah bukaan.
              </p>
            </li>
            <li>
              <strong>Periksa konteks.</strong>
              <p>
                Tinjauan denah menampilkan jejak sumber. Skenario bencana tidak
                diberi rute sebelum SOP dan tujuannya tersedia.
              </p>
            </li>
            <li>
              <strong>Amati arah.</strong>
              <p>
                Garis hijau utuh dan garis amber putus mengikuti legenda sumber.
                Tombol putar menggerakkan panah; tombol jeda menghentikannya.
              </p>
            </li>
            <li>
              <strong>Kenali K1 dan K2.</strong>
              <p>
                KU berada di lapangan luar sekolah. K1 dan K2 menjadi pilihan
                sementara saat akses keluar padat atau terhalang. Skenario angin
                kencang memerlukan ruang perlindungan yang belum ditentukan.
              </p>
            </li>
          </ol>
          <p>
            Model 3D memakai tinggi ilustratif. Bentuk berarsir pada 2D
            menunjukkan bangunan tanpa kode yang terbaca.
          </p>
        </Dialog>
      )}
    </>
  );
}
