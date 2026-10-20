# Hasil pemeriksaan — 20 Oktober 2026

Versi **0.2.0-draft**. Pemeriksaan menilai perangkat lunak dan konsistensi media, bukan keselamatan jalur di lapangan.

| Pemeriksaan | Hasil |
|---|---|
| Skema, validasi data, TypeScript dan build | Lulus |
| Tes data | 20/20 lulus, termasuk pengecualian pintu, transformasi citra, dan syarat kalibrasi GPS |
| Tes browser | 18 skenario × Chrome/WebKit = 36 pemeriksaan lulus, termasuk Peta lokasi, GPS, taman, dan K1/K2 |
| Ukuran layar | 360, 768, 1440 piksel; tidak ada overflow halaman pada kasus uji |
| Animasi dan keyboard | Jeda, ulangi, reduced motion, pemilihan gedung, dan fokus dialog lulus |
| Kegagalan WebGL | Aplikasi tetap menyediakan kembali ke 2D |
| Jenis pintu | A satu daun ke dalam; C kiri/O atas geser; M kiri satu daun; G–H sesuai lantai dan pengecualian |
| Tanda G–H | Delapan cyan lantai 1 dan enam lantai 2; tiga pintu H lantai 1 yang terlewat sudah ditambahkan, H paling kanan satu daun |
| Pembagian ruang | Segmen lurus, mengikuti arah gedung; garis G–H dibatasi tapak; label kode ditampilkan di atas garis |
| Skenario | Angin kencang tanpa tujuan lapangan; KU normal; K1/K2 tetap terlihat sebagai sementara, ditonjolkan pada padat/terhalang |
| Prapemetaan | Enam pasangan titik; transformasi diuji dengan data sintetis dan penolakan titik segaris; selisih visual dilaporkan dalam piksel |
| PDF kampus | A3/A4, satu halaman masing-masing; 279 operasi path vektor; versi, KU/K1/K2 dan status draf tersedia |
| PDF tambahan | G–H lantai 1/2 serta prapemetaan masing-masing satu halaman A4; semua ID pintu/koordinat acuan yang diperlukan tersedia |
| Video utama | 1920 × 1080, 30 fps, 120 detik, tanpa suara; dekode penuh lulus |
| Video vertikal | 1080 × 1920, 30 fps, 50 detik, tanpa suara; dekode penuh lulus |
| Rilis operasional | Ditolak karena belum ada pengesahan, rute operasional, dan kelengkapan data |

PNG cetak dan tangkapan layar aplikasi ditinjau secara visual. Garis ruang tidak bergelombang; kode A/B/C dan kode lainnya memakai latar kecil agar tetap terbaca. Detail G–H memiliki daftar bukaan terpisah. Tangkapan layar pemeriksaan lokal berada di `artifacts/` dan tidak disertakan dalam repositori publik.

Laporan terstruktur lokal: `artifacts/pdf-report.json`, `detail-pdf-report.json`, `export-report.json`, dan `video-render.json`. Manifest ekspor berisi ukuran dan SHA-256. Laporan lokal tidak disertakan dalam repositori publik.

## Batas hasil

- Chrome/WebKit diuji otomatis; ini bukan pengujian Safari di iPhone fisik.
- Pemeriksaan aksesibilitas otomatis tidak mencakup seluruh kebutuhan pengguna.
- Tidak ada peninjauan lapangan, pengukuran kapasitas, simulasi kepadatan, atau persetujuan SOP.
- Sambungan ruang yang belum jelas tidak dijadikan rute. Jaringan fisik dan jejak referensi bukan pengesahan perjalanan dari suatu pintu.
- Pintu memakai posisi visual dalam denah, tanpa koordinat geografis. Penunjuk utara dari citra pembanding masih perkiraan; satu titik koordinat lapangan belum cukup untuk memetakan GPS ke denah.
- Model 3D bersifat ilustratif; tinggi, ukuran pintu dan konstruksi tangga belum diukur.
- Media tetap berstatus draf. Kode dan media draf disimpan di repositori publik atas instruksi pengguna; ini bukan rilis operasional. Dokumen sumber pribadi tidak disertakan.
