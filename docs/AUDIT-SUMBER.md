# Audit sumber — 0.2.0-draft

Tanggal pencatatan: 20 Oktober 2026. Konfirmasi pengguna memperbarui fakta pada dokumen sebelumnya. Arahan BPBD dicatat sebagai informasi yang disampaikan pengguna, bukan dokumen pengesahan.

## Sumber dan pemakaian

- Denah lama: tapak, kode gedung, dan tujuh potongan garis referensi. Garis juga disimpan sebagai jaringan koridor tanpa aturan satu arah.
- `public/reference/gh-lantai-1.png` dan `gh-lantai-2.png`: merah menunjukkan batas ruang; cyan menunjukkan bukaan; abu-abu gelap bukan pintu atau tangga.
- `public/reference/pintu-kampus.png`: pintu dan batas ruang A–F, I, J serta UKS. UKS adalah ruang kecil di sambungan F–I, bukan seluruh F; keterangan awal E–I telah dikoreksi pengguna.
- `public/reference/pintu-selatan.png`: pintu N, O, M; bangunan yang sebelumnya U9 menjadi bagian O yang terpisah.
- `public/reference/google-maps-satelit.png`: tangkapan layar pengguna, dengan atribusi Google Maps. Tanggal citra tidak diketahui.
- `public/reference/udara-referensi.png` dan `udara-batas-pengguna.png`: pembanding gambar udara. Ketelitian dan asal gambar awal belum terverifikasi sebagai survei. Garis batas tambahan bukan bukti batas kadastral.
- [Tautan lokasi pengguna](https://maps.app.goo.gl/NccieSzoH9xsq2sDA) mengarah ke pencarian -7.454896, 112.398510. Pengguna menetapkan titik tersebut sebagai tengah lapangan upacara.
- Dokumen LK/SPAB lama tetap menjadi referensi tekstual. Informasi kesehatan individual dan nomor pribadi tidak disalin ke aplikasi.

## Fakta yang dikonfirmasi pengguna

A1 adalah pos terbuka beratap tanpa pintu. G–H terdiri atas dua lantai dengan koridor atas terhubung serta tangga di kiri G dan kanan H. Pintu G–H dua daun kaca, kecuali ujung kanan H lantai 1 satu daun. Lantai 1 membuka keluar, kecuali pintu bawah pusat G berayun dua arah. G lantai 2 membuka ke dalam; H lantai 2 keluar.

Gedung lain mengikuti dua daun keluar, dengan pengecualian A satu daun ke dalam, C paling kiri dan O bagian atas dua daun geser kanan–kiri, serta M paling kiri satu daun keluar. Bangunan terpisah O dan UKS menggunakan dua daun keluar. Kebijakan umum tidak dipakai untuk mengarang jumlah pintu pada bangunan yang belum ditandai.

KU berada di lapangan luar, melalui gerbang kiri dan penyeberangan jalan. Gerbang kanan perlu dibuka petugas dan sambungan luarnya belum diketahui. K1/K2 adalah pilihan sementara saat akses keluar padat/terhalang; bukan persinggahan wajib. Angin kencang memerlukan perlindungan di dalam ruangan; ruangnya belum ditentukan.

## Perbedaan gambar dan keterangan

Pemeriksaan ulang gambar G–H lantai 1 menemukan delapan tanda cyan: empat di G dan empat di H. Tiga bukaan H yang sebelumnya terlewat ditambahkan sebagai pintu kaca dua daun membuka ke luar; yang paling kanan tetap satu daun sesuai keterangan pengguna. Abu-abu gelap tetap elemen pemisah, bukan bukaan tambahan. Lantai 2 memuat enam tanda cyan (tiga G dan tiga H). Satu bukaan dua daun tetap satu ID.

Koordinat piksel adalah penempatan grafis, bukan koordinat geografis pintu. Sesuai arahan pengguna, pintu dikenali secara visual. Garis pembagian ruang diluruskan mengikuti sumbu gedung dan ditipiskan; label kode berada di atas garis. Penyesuaian ini adalah perapian ilustrasi, bukan hasil pengukuran.

## Prapemetaan

Enam titik sementara dipilih pada objek yang bersesuaian. `data/registration.json` menyimpan pasangan piksel, satu acuan geografis, sumber, dan batas penggunaan. Transformasi afin kuadrat terkecil dihitung terpisah untuk denah dan gambar udara terhadap tangkapan layar satelit. Selisih titik ditampilkan dalam piksel; tidak dikonversi ke meter. Transformasi tidak mengganti tapak induk secara diam-diam.

Satu titik geografis belum menentukan skala meter dan orientasi geografis secara terukur. Penunjuk U/T/S/B pada denah, Peta lokasi, dan peta cetak adalah perkiraan dari citra Google Maps pembanding yang diasumsikan utara di atas. Tidak ada koordinat geografis pintu, jarak meter, orientasi utara terverifikasi, atau batas lahan resmi yang dihasilkan. Perbedaan bentuk antargambar tetap terlihat untuk ditinjau.

## Belum lengkap

Sambungan sejumlah ruang ke koridor, jumlah pintu pada bagian yang tidak ditandai, kapasitas tujuan, alokasi titik sementara, aksesibilitas, SOP, prosedur penyeberangan dan pembukaan gerbang, serta peninjauan sekolah belum lengkap. Tidak ada rute operasional yang disahkan. Arsip data dan audit sebelumnya berada di `data/history/` dan `docs/history/`.

Tambahan pengguna: pintu ruang tengah B di ujung kiri dilengkapi (B1-D03). L dibagi tiga ruang dengan pintu dua daun keluar di sisi kiri/bawah; K tiga ruang dengan pintu dua daun keluar di sisi kiri dekat ujung bawah setiap ruang. Posisi berdasarkan keterangan, tetap skematis. Setelah koreksi G–H lantai 1, total 56 bukaan visual tercatat.

Koreksi terakhir K menggantikan keterangan sisi kanan. ID pintu tetap K1-D01–K1-D03; yang berubah adalah posisi visual dan sumber koreksi.

Dua taman di bagian atas lapangan upacara ditambahkan sebagai penghalang berdasarkan gambar udara dan anotasi pengguna. Jejak T5 berhenti sebelum taman barat; ujung lama tersimpan pada arsip. K1/K2 tetap terlihat pada kondisi normal sebagai titik sementara/alternatif, dengan penekanan berubah menurut kondisi simulasi. Angin kencang tetap tidak menawarkan tujuan lapangan.
