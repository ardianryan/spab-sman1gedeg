# Peta Kesiapsiagaan SMA Negeri 1 Gedeg

Versi **0.2.0-draft**. Paket draf lokal: website 2D, model 3D tingkat gedung, peta cetak, dan video sosialisasi. **Belum untuk penggunaan operasional.** Tidak ada rute dari gedung yang disahkan pada data awal. Tujuh potongan jejak ditelusuri dari gambar lama, bukan hasil survei atau tujuh rute resmi.

## Membuka aplikasi

Memerlukan Node.js 22.12+ (diuji pada Node 26.8.1) dan npm. Jalankan dari folder ini:

```sh
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan, biasanya http://127.0.0.1:5173. Aplikasi tidak memerlukan akun, API key, billing, atau koneksi ke layanan ubin peta. Foto udara dan font disimpan lokal. Gunakan server HTTP; membuka `index.html` lewat `file://` tidak menjalankan aplikasi React.

**Denah 2D** tetap menjadi tampilan utama. Tab kedua, **Peta lokasi**, memakai Leaflet dengan foto udara lokal dan denah sebagai lapisan. Tautan Google Maps hanya membuka situs Google di tab baru; tidak ada ubin Google yang dimuat di aplikasi.

Tombol **Kamu sedang di sini** meminta izin GPS perangkat. Pada ponsel, aplikasi perlu dibuka lewat HTTPS; `localhost` dapat dipakai saat pengembangan. Koordinat dan akurasi GPS ditampilkan segera, tetapi penanda pada denah baru muncul setelah sedikitnya empat titik acuan geografis yang tersebar cocok dengan denah. Saat ini baru ada satu acuan: tengah lapangan upacara. Tim sekolah dapat menambahkan titik di panel **Kalibrasi peta** dengan memilih letak pada peta dan mengisi koordinat titik yang sama. Titik tambahan disimpan hanya di `localStorage` browser tersebut; hasilnya masih draf dan perlu diperiksa di lapangan. Jika GPS ditolak, pengguna tetap memilih gedung secara manual. Penunjuk U/T/S/B pada denah, Peta lokasi, dan peta cetak diturunkan dari pencocokan citra Google Maps yang diasumsikan utara di atas; arahnya masih perkiraan visual, bukan hasil ukur kompas di lapangan.

Untuk versi produksi lokal:

```sh
npm run build
npm run preview
```

Hasil ada di `dist/`. Folder ini tidak memuat dokumen sumber pribadi. Canonical, sitemap, dan metadata berbagi memakai domain `https://spab.sman1gedeg.sch.id/`. Publikasi domain memerlukan DNS dan HTTPS yang dikonfigurasi pada server.

## Image GHCR dan Portainer Stack

Setiap push ke `main` menjalankan uji data, build, uji browser, pemeriksaan PDF/video, lalu menerbitkan dan menjalankan image `ghcr.io/ardianryan/spab-sman1gedeg:latest` sebagai uji stack. Pull request hanya menjalankan pemeriksaan, tanpa izin menerbitkan paket. Image juga diberi tag berdasarkan commit; tag `v*` diterbitkan bila dibuat. Workflow berada di `.github/workflows/ghcr.yml`.

Di Portainer, buka **Stacks → Add stack → Web editor**, beri nama `spab-sman1gedeg`, lalu tempel isi [`deploy/portainer-stack.yml`](deploy/portainer-stack.yml). Nilai bawaan menerbitkan HTTP hanya di `127.0.0.1:8080` pada host; tambahkan variabel lingkungan stack `SPAB_PORT` bila port tersebut sudah dipakai. Jika reverse proxy berada di mesin lain, atur `SPAB_BIND_IP` ke alamat antarmuka privat server yang dapat dijangkau proxy tersebut, lalu batasi aksesnya dengan firewall. Tekan **Deploy the stack**. Jika memilih metode **Repository**, gunakan URL repositori ini dan jalur berkas `deploy/portainer-stack.yml`.

Arahkan `spab.sman1gedeg.sch.id` ke server dan pasang reverse proxy HTTPS ke port host stack. HTTPS diperlukan agar izin lokasi browser dapat bekerja pada ponsel. Image hanya menyajikan HTTP di dalam container; sertifikat TLS dikelola oleh reverse proxy. Stack menjalankan container tanpa hak istimewa tambahan, dengan sistem berkas hanya baca dan direktori sementara terbatas. Untuk memperbarui image `latest`, gunakan **Pull latest image** saat memperbarui stack di Portainer, atau tetapkan tag commit agar rilis tetap sama sampai diubah sengaja. Periksa `http://127.0.0.1:8080/healthz` pada host dan halaman utama melalui reverse proxy setelah deployment.

Paket GHCR yang baru dibuat mungkin berstatus privat meskipun repositori publik. Bila Portainer gagal menarik image, ubah visibilitas paket di halaman **Packages → spab-sman1gedeg → Package settings** menjadi publik, atau tambahkan kredensial registry GHCR dengan izin baca paket di Portainer. Pengaturan visibilitas paket merupakan keputusan pemilik repositori. Alur ini tidak meminta API key peta maupun billing ubin peta.

Situs yang dipublikasikan tetap berlabel **draf**. Penerbitan image tidak mengesahkan jalur evakuasi.

Jika memakai paket lengkap yang sudah berisi `dist/`, cukup jalankan `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`, lalu buka http://127.0.0.1:4173. Cara ini tidak memerlukan instalasi dependensi Node.

## Keluaran

Semua keluaran tersedia melalui **Unduh media** di aplikasi atau folder `public/exports/`:

- `gh-lantai-1.*`, `gh-lantai-2.*`: detail pintu dan koridor dalam PDF/SVG/PNG.
- `prapemetaan.*`, `prapemetaan-data.json`: pencocokan citra sementara dan pasangan titik.
- `peta-a3.pdf`, `peta-a4.pdf`: PDF vektor satu halaman.
- `peta.svg`: denah induk dalam komposisi cetak, dapat disunting.
- `peta.png`: gambar 2382 × 3368 untuk presentasi.
- `sosialisasi-utama.mp4`: 1920 × 1080, 30 fps, 120 detik, tanpa suara.
- `sosialisasi-vertikal.mp4`: 1080 × 1920, 30 fps, 50 detik, tanpa suara.
- Dua berkas `.srt`: takarir terpisah. Teks penjelas juga tertanam dalam gambar video.
- `naskah-video.txt`: naskah untuk ditinjau sebelum rekaman suara.
- `lembar-verifikasi.csv`: daftar pemeriksaan gedung, tujuan, jejak, dan SOP.

Panduan pengubahan data ada di `docs/PANDUAN-DATA.md`, audit sumber di `docs/AUDIT-SUMBER.md`, dan hasil pemeriksaan di `docs/VERIFIKASI.md`.

## Pengujian dan ekspor ulang

```sh
npm test
npm run build
npx playwright install webkit
npm run test:browser
npm run export:print
npm run export:registration
```

Browser ekspor memakai Google Chrome lokal pada macOS bila tersedia, atau Chromium Playwright. Di perangkat lain jalankan `npx playwright install chromium webkit`. Pengujian WebKit bukan pengujian aplikasi Safari pada perangkat iOS fisik.

Untuk video, jalankan `npm run dev` di terminal pertama, lalu:

```sh
npm run export:video
npm run export:verify
npm run build
```

`PREVIEW_URL` dapat digunakan jika port berbeda. Video memakai FFmpeg dari dependensi proyek. Jika npm menonaktifkan skrip instalasi dan biner belum tersedia, jalankan `node node_modules/ffmpeg-static/install.js`. Ekspor video mengambil bingkai browser secara deterministik, merangkai adegan dengan FFmpeg, lalu menghasilkan MP4. Berkas perantara berada di `artifacts/frames/` dan boleh dihapus setelah pemeriksaan.

`npm run export:verify` memeriksa video dengan ffprobe, melakukan dekode penuh, dan menulis hash berkas. Pemeriksaan PDF terpisah: `npx tsx scripts/verify-pdf.ts`.

## Gerbang rilis operasional

```sh
npm run release:check
```

Perintah ini **harus gagal untuk data awal**. Mengganti `meta.status` menjadi `operational` juga membuat validasi build menolak data yang belum lengkap. Persetujuan sekolah tidak dibuat otomatis oleh aplikasi.

Versi pertama tetap merupakan alat peninjauan. Penambahan rute operasional memerlukan pemeriksaan lapangan, pengisian data akses dan SOP, peninjauan kode ekspor agar menggunakan rute tersebut, serta pembangunan ulang seluruh media. Lulus pemeriksaan teknis tidak mengesahkan keselamatan jalur.

## Pemeliharaan

Data denah dan akses: `data/campus.json`. Prapemetaan visual: `data/registration.json`. Jangan mengubah jalur hanya pada SVG hasil ekspor atau hanya pada video. Setiap perubahan data harus memiliki sumber, nomor versi baru, alasan perubahan, dan ekspor ulang. Simpan paket versi sebelumnya untuk audit. Perubahan bangunan, akses, hambatan, atau SOP membatalkan peninjauan rute yang terdampak.

Tidak ada analitik, pelacakan pengguna oleh server, data kesehatan individu, atau nomor pribadi dalam aplikasi. GPS hanya digunakan setelah izin browser; posisi langsung tidak dikirim ke server aplikasi atau disimpan. Titik kalibrasi yang dimasukkan pengguna tersimpan di browser setempat. Dokumen DOCX/PPTX asli tetap di folder lokal dan tidak disalin ke `public/`.

## Penelusuran dan lisensi

Halaman menyediakan metadata kanonis, Open Graph, data terstruktur Schema.org, `robots.txt`, `sitemap.xml`, `llms.txt`, dan `llms-full.txt`. Peta adalah aplikasi satu halaman sehingga sitemap hanya mencantumkan halaman utama; mode video berbasis parameter URL tidak dicantumkan sebagai halaman tersendiri. Materi AI menjelaskan keterbatasan data agar jejak draf tidak disalahartikan sebagai rute resmi. Setelah DNS dan HTTPS aktif, periksa URL kanonis dan kirim sitemap melalui layanan pengelola mesin pencari yang digunakan sekolah.

Kode sumber dilisensikan menurut [GNU Affero General Public License versi 3](LICENSE) (`AGPL-3.0-only`). Logo sekolah, foto, citra referensi, dan dokumen sumber memiliki hak masing-masing pemilik; berkas tersebut tidak dinyatakan sebagai karya berlisensi AGPL. Tautan kode sumber tersedia di antarmuka bagi pengguna layanan melalui jaringan.

## Draf denah dari atap

Buka **Prapemetaan citra → Draf denah atap** untuk membandingkan penelusuran baru dengan gambar udara, citra satelit, dan garis denah lama. Data tersimpan di `data/roof-plan.json`; geometri memakai koordinat piksel gambar udara. Atap ditelusuri manual, bukan dipindai otomatis. Kode gedung dan bentuknya masih perlu ditinjau, terutama atap gabungan dan bidang yang belum memiliki kode.

Jalankan `npm run export:roof` untuk membangun ulang SVG, PNG, PDF, dan JSON pada `public/exports/denah-atap*`. Versi baru ini belum memuat pemindahan pintu atau rute. Asal gambar udara belum terverifikasi sebagai foto drone asli, dan pencocokan citra tidak sama dengan kalibrasi GPS final.
