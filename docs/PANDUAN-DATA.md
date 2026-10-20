# Panduan data dan pembaruan

## Sumber tunggal

Edit `data/campus.json`. Struktur divalidasi Zod di `src/model.ts`. Setiap kode objek harus tetap stabil meskipun nama tampilannya berubah. Simpan nilai belum diketahui sebagai `null` atau daftar kosong, bukan angka 0 atau nama dugaan.

Koordinat `[x,y]` menggunakan piksel gambar sumber. Tapak disimpan sebagai daftar titik polygon; jalur referensi sebagai polyline. Jangan mengubah sistem koordinat untuk satu objek saja. Label dan model 3D memakai tapak yang sama. Tinggi 3D bersifat ilustratif; G–H memiliki dua tingkat dan A1 terbuka beratap. `heightMeters` tetap belum diukur.

## Tabel utama

| Koleksi | Penggunaan |
|---|---|
| `buildings` | Kode, nama bila diketahui, tapak, posisi label, daftar akses, status verifikasi |
| `unidentified` | Tapak tanpa kode yang terbaca; ditampilkan berarsir |
| `grounds` | Bentuk dan label lapangan |
| `destinations` | KU utama serta K1/K2 sementara bersyarat; kapasitas dan peninjauan belum tersedia |
| `referenceTraces` | Salinan potongan garis dari sumber, tidak menunjukkan rute dari gedung |
| `accessNodes` | Kosong saat ini; kelak berisi pintu, simpang, ramp, atau tangga yang diperiksa |
| `routes` | Kosong saat ini; kelak menghubungkan pintu gedung ke tujuan melalui simpul |
| `scenarios` | Tinjauan denah dan skenario bencana dengan SOP yang belum lengkap |
| `facilities`, `hazards` | Catatan tekstual; posisi `null` berarti tidak boleh dipasang sebagai marker |
| `sources`, `meta`, `uncertainties` | Asal data, versi, status, bukti peninjauan, dan kekurangan |

## Alur perubahan

1. Catat bukti pemeriksaan sebelum memperbarui data. Jangan mengimpor data kesehatan individu atau nomor pribadi.
2. Perbarui objek terkait, sumber, `meta.version`, dan `meta.date`. Selama belum lengkap, pertahankan `status: draft`.
3. Jalankan `npm test` dan `npm run build`. Periksa denah secara visual; tes geometri tidak menilai kondisi nyata.
4. Jalankan uji browser jika interaksi atau bentuk peta berubah.
5. Ekspor ulang cetak dan video dari versi yang sama. Jalankan pemeriksaan ekspor dan build sekali lagi agar `dist/` memuat berkas terbaru.
6. Catat revisi pada `docs/CHANGELOG.md`. Jangan menimpa bukti verifikasi sebelumnya.

## Persyaratan rute masa depan

Rute harus mempunyai asal gedung, tujuan, skenario, kategori utama/alternatif, serta minimal dua ID simpul. Simpul pertama harus merupakan pintu pada gedung asal. Simpul terakhir harus bertepatan dengan tujuan. Skenario harus mencantumkan ID rute yang sesuai.

Peninjauan memuat `role`, tanggal ISO `YYYY-MM-DD`, dan `evidence`. Seluruh gedung, akses, tujuan, dan SOP terkait perlu diperiksa sebelum rilis. `npm run release:check` menolak data kosong atau tidak lengkap. Jangan menambahkan catatan peninjauan fiktif untuk meloloskan pemeriksaan.

Ekspor cetak dan video pada versi ini sengaja menampilkan `referenceTraces`, bukan rute operasional. Jika sekolah telah mengesahkan rute, lakukan perubahan terkontrol pada komposisi cetak dan alur video, tambahkan pengujian kesetaraan rute, dan verifikasi ulang seluruh artefak. Jangan sekadar menghapus label DRAF.

## Perilaku aplikasi

Memilih gedung tidak otomatis memilih jalur terdekat. Skenario bencana tidak menggunakan jejak referensi. Fasilitas tanpa posisi hanya ditampilkan dalam daftar. Model 3D tidak mengukur ketinggian atau menampilkan interior. GPS browser tersedia di tab Peta lokasi setelah izin pengguna; tidak ada pembaruan kondisi bencana secara langsung, algoritme kapasitas, atau deteksi bencana.

Peta lokasi memakai Leaflet dengan foto udara lokal. Transformasi foto terhadap denah berasal dari `data/registration.json` dan masih visual. Penanda GPS memerlukan sedikitnya empat pasangan koordinat geografis–piksel denah yang tersebar serta hasil transformasi yang konsisten. Satu titik tengah lapangan telah tersedia; titik tambahan dimasukkan melalui panel kalibrasi dan disimpan di `localStorage` browser, bukan di data rute. Periksa titik dan akurasi GPS di lapangan sebelum memakai penanda untuk peninjauan. Penunjuk U/T/S/B pada denah interaktif dan peta cetak dihitung dari transformasi denah ke citra Google Maps pembanding, dengan asumsi citra utara di atas. Arah ini masih perkiraan visual sampai orientasi diperiksa di lapangan. Pintu tidak memerlukan koordinat geografis.

## Penerbitan

Repositori publik memuat kode dan media draf untuk peninjauan, bukan peta evakuasi operasional. `dist/` dapat dijalankan melalui server statis untuk pengujian. Jangan mengunggah DOCX/PPTX asli, `node_modules/`, atau data pribadi. Rilis operasional tetap ditahan hingga ada persetujuan sekolah dan versi operasional telah ditinjau sebagai perubahan tersendiri.

## Pembaruan 0.2.0

`access` menampung pemetaan visual yang dikonfirmasi pengguna dan belum menjadi rute operasional. Validasi ada di `src/access.ts`, terintegrasi ke `src/model.ts`.

| Koleksi akses | Isi |
|---|---|
| `policies` | Kebijakan umum pintu per gedung, termasuk pengecualian A1 |
| `doors` | ID tetap, gedung, lantai, posisi piksel, sumber, jumlah daun, gerak, bukaan relatif ruang; status hubungan koridor |
| `floorPlans` | Tapak lokal G–H per lantai, batas ruang, koridor |
| `walls` | Segmen lurus dua titik sejajar arah gedung; bukan koordinat geografis |
| `rooms` | UKS dan hubungan bukaan yang dapat diidentifikasi |
| `buildingParts` | Bagian O yang terpisah secara fisik tetapi tetap dalam pilihan O |
| `nodes`, `edges` | Jaringan fisik; perpindahan lantai menggunakan tangga, keluar lantai dasar ditandai tersendiri |
| `gates` | Gerbang normal dan gerbang yang perlu dibuka petugas |

ID seperti `A1-D01` berarti gedung A, lantai 1, bukaan pertama; gedung dengan kode A1 sendiri tidak memiliki pintu. Jangan menyamakan jumlah daun dengan jumlah bukaan. `motion: sliding` wajib memiliki `swing: null`; pintu ayun memiliki arah `inward`, `outward`, atau `both`. Arah bukaan tidak mengubah koridor menjadi satu arah.

Semua posisi merupakan ilustrasi yang belum diukur. Koreksi ruang tidak boleh otomatis menambahkan hubungan ke koridor. `connectionStatus: incomplete` mempertahankan pesan belum tersedia. Jenis pintu gedung yang belum ditandai dapat diketahui tanpa memiliki jumlah atau posisi.

Tujuan menggunakan `role`, `scenarioIds`, dan kondisi. `activeDestinations` mengatur penekanan KU pada kondisi normal dan K1/K2 pada padat/terhalang. Semua penanda tetap terlihat di kedua kondisi tersebut; angin kencang tidak menawarkan tujuan lapangan. Kontrol pembukaan gerbang adalah simulasi, bukan status langsung.

`data/registration.json` terpisah dari data rute: pasangan titik visual dan acuan tengah lapangan. `src/registration.ts` menghitung transformasi afin serta selisih piksel. Jangan mengubah hasil transformasi menjadi koordinat geografis pintu. Untuk memperbaiki pencocokan, koreksi pasangan titik dengan bukti visual, lalu bangun ulang `npm run export:registration`.

Ekspor tambahan: `gh-lantai-1.*`, `gh-lantai-2.*` (PDF/SVG/PNG), serta `prapemetaan.*` dan `prapemetaan-data.json`. Seluruh media menggunakan versi kampus yang sama. Model G–H menampilkan dua tingkat ilustratif; A1 memiliki atap dan tiang. Tinggi dan bentuk tangga bukan hasil survei.

`obstacles` menyimpan dua taman lapangan upacara. Validasi jejak dan koridor memperhitungkan penghalang walaupun lapisannya disembunyikan. Jangan membuat rute menembus taman untuk mempertahankan garis dari sumber lama.
