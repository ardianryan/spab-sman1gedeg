import { FloorArtwork } from "./AccessArtwork";
import { useEffect, useState } from "react";
import { MapArtwork } from "./MapArtwork";
import { campus, defaultLayers } from "./model";
export const chapters = [
  {
    title: "Kenali lingkungan sekolah.",
    text: "SMAN 1 Gedeg · versi 0.2.0-draft. Pintu, koridor, dan tujuan diperbarui dari keterangan pengguna.",
    selected: null,
    traces: false,
    floor: 0,
  },
  {
    title: "G–H memiliki dua lantai.",
    text: "Koridor lantai atas terhubung. Tangga berada di ujung kiri G dan ujung kanan H. Bentuk tangga masih ilustratif.",
    selected: "G",
    traces: false,
    floor: 2,
  },
  {
    title: "Kenali bukaan setiap pintu.",
    text: "G–H lantai 1 membuka keluar; pintu bawah G berayun dua arah. H paling kanan lantai 1 berdaun tunggal. G lantai 2 membuka ke dalam.",
    selected: "G",
    traces: false,
    floor: 1,
  },
  {
    title: "Menuju lapangan utama KU.",
    text: "Pos A1 terbuka tanpa pintu. Gerbang kiri menjadi akses normal menuju penyeberangan jalan dan KU. Gerbang kanan perlu dibuka petugas.",
    selected: "A1",
    traces: true,
    floor: 0,
  },
  {
    title: "Perhatikan pengecualian pintu.",
    text: "A: satu daun ke dalam. C paling kiri dan O bagian atas: dua daun geser. M paling kiri: satu daun ke luar. UKS berada di sambungan F–I.",
    selected: "O",
    traces: false,
    floor: 0,
  },
  {
    title: "K1 dan K2 bersifat sementara.",
    text: "Saat akses keluar padat atau terhalang, K1 dan K2 menjadi pilihan sementara. Alokasi gedung dan kapasitas belum ditetapkan.",
    selected: null,
    traces: false,
    floor: 0,
  },
  {
    title: "Angin kencang: perlindungan dalam ruang.",
    text: "KU, K1, dan K2 tidak menjadi tujuan aktif. Ruang perlindungan yang sesuai belum ditentukan oleh sekolah.",
    selected: null,
    traces: false,
    floor: 0,
  },
  {
    title: "Verifikasi sebelum digunakan.",
    text: "Cocokkan posisi pintu, hubungan ruang, akses, penyeberangan, dan SOP bersama tim sekolah. Draf ini belum menjadi panduan operasional.",
    selected: null,
    traces: false,
    floor: 0,
  },
];
declare global {
  interface Window {
    setVideoFrame?: (chapter: number, progress: number) => void;
    videoReady?: boolean;
  }
}
export function VideoScene() {
  const [state, setState] = useState({ chapter: 0, progress: 0 });
  const vertical =
    new URLSearchParams(location.search).get("video") === "vertical";
  useEffect(() => {
    window.setVideoFrame = (chapter, progress) =>
      setState({ chapter, progress });
    window.videoReady = true;
    return () => {
      delete window.setVideoFrame;
      delete window.videoReady;
    };
  }, []);
  const c = chapters[state.chapter];
  const traces = campus.referenceTraces.filter((t) => t.category === "utama");
  return (
    <div className={`video-frame ${vertical ? "vertical" : ""}`}>
      <header>
        <div className="video-brand">
          <img
            src="./brand/logo-sman-1-gedeg.png"
            alt="Logo SMA Negeri 1 Gedeg"
          />
          <strong>SPAB / SMAN 1 Gedeg</strong>
        </div>
        <span>MEDIA PENINJAUAN · {campus.meta.version}</span>
      </header>
      <div className="video-content">
        <div className="video-copy">
          <span className="video-step">
            {String(state.chapter + 1).padStart(2, "0")} / 08
          </span>
          <h1>{c.title}</h1>
          <p>{c.text}</p>
          <div className="video-legend">
            <span>━━━━ Jejak utama</span>
            <span>┄┄┄┄ Jejak alternatif</span>
          </div>
        </div>
        <svg viewBox={c.floor ? "0 15 460 145" : campus.meta.viewBox.join(" ")}>
          {c.floor ? (
            <FloorArtwork floor={c.floor} />
          ) : (
            <MapArtwork
              activeTargets={
                state.chapter === 6
                  ? []
                  : state.chapter === 5
                    ? ["K1", "K2"]
                    : ["KU", "K1", "K2"]
              }
              selected={c.selected}
              layers={{ ...defaultLayers, traces: c.traces }}
              traces={traces}
              progress={state.progress}
            />
          )}
        </svg>
      </div>
      <footer>
        <strong>DRAF</strong>
        <span>BELUM DIVERIFIKASI UNTUK PENGGUNAAN OPERASIONAL</span>
      </footer>
    </div>
  );
}
