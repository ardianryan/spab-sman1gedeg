# Riwayat versi

## 0.2.0-draft — 20 Oktober 2026

- Tab kedua Peta lokasi ditambahkan tanpa mengubah Denah 2D. Leaflet menampilkan foto udara dan denah lokal; Google Maps hanya tautan eksternal.
- GPS browser menampilkan koordinat dan akurasi setelah izin. Penanda serta lingkaran akurasi pada peta ditahan sampai minimal empat titik geografis cocok; satu titik lapangan sudah tersedia. Titik tambahan disimpan lokal di browser.
- Penunjuk U/T/S/B perkiraan pada denah, Peta lokasi, dan peta cetak berasal dari pencocokan dengan citra pembanding; belum menggantikan pengukuran lapangan.
- Koreksi G–H lantai 1: tiga tanda cyan pada H yang sebelumnya terlewat kini menjadi H1-D02–H1-D04, pintu kaca dua daun membuka ke luar. H1-D01 paling kanan tetap satu daun. Total 56 bukaan tercatat.

- Pemetaan pintu dan batas ruang dari gambar tambahan; pengecualian A, C, G–H, O, M; UKS di sambungan F–I.
- O mencakup bangunan terpisah yang sebelumnya belum berkode; A1 menjadi pos terbuka tanpa pintu.
- Lantai G–H, dua tangga, gerbang kiri/kanan, KU, serta kondisi simulasi normal/padat/terhalang.
- Angin kencang tidak menampilkan tujuan lapangan; ruang perlindungan belum ditentukan.
- Garis pembagian diluruskan mengikuti gedung dan ditipiskan; kode gedung ditampilkan di atas garis.
- Prapemetaan citra Google Maps dan gambar udara memakai enam pasangan titik sementara. Acuan geografis tengah lapangan: -7.454896, 112.398510. Tidak menghitung koordinat pintu.
- Media diperbarui; lembar G–H per lantai dan laporan prapemetaan ditambahkan. Data 0.1.0 disimpan dalam riwayat.
- Tetap draf lokal; konfirmasi pengguna tidak diperlakukan sebagai pengesahan operasional.


## 0.1.0-draft — 20 Oktober 2026

- Penelusuran denah sumber: 16 kode gedung, 10 tapak tanpa kode, tiga lapangan, dua penanda titik kumpul sementara, dan tujuh potongan jejak.
- Website 2D dan model 3D ilustratif dari satu data induk, termasuk kontrol kamera, pemilihan gedung, lapisan, dan animasi arah.
- Skenario gempa, angin kencang, dan genangan ditandai belum lengkap tanpa mengarang rute.
- PDF A3/A4, SVG, PNG, video 120/50 detik, takarir, naskah, dan lembar verifikasi.
- Belum ada rute operasional yang disahkan. Tidak ada publikasi.
- Logo asli yang diberikan pengguna dipasang pada aplikasi, cetak, dan video; bentuk dan warna tidak diubah.

Tambahan pengguna: pintu ruang tengah B di ujung kiri dilengkapi (B1-D03). L dibagi tiga ruang dengan pintu dua daun keluar di sisi kiri/bawah; K tiga ruang dengan pintu dua daun keluar di sisi kiri dekat ujung bawah setiap ruang. Posisi berdasarkan keterangan, tetap skematis. Jumlah awal 53 bukaan visual, sebelum koreksi tiga pintu H lantai 1.

Koreksi terakhir K menggantikan keterangan sisi kanan. ID pintu tetap K1-D01–K1-D03; yang berubah adalah posisi visual dan sumber koreksi.

Dua taman di bagian atas lapangan upacara ditambahkan sebagai penghalang berdasarkan gambar udara dan anotasi pengguna. Jejak T5 berhenti sebelum taman barat; ujung lama tersimpan pada arsip. K1/K2 tetap terlihat pada kondisi normal sebagai titik sementara/alternatif, dengan penekanan berubah menurut kondisi simulasi. Angin kencang tetap tidak menawarkan tujuan lapangan.

## Prapemetaan geografis — 28 Oktober 2026

- Empat koordinat tambahan disimpan bersama koordinat tengah lapangan upacara, berikut sumber dan status pencocokannya.
- Gerbang kiri A1 dipasangkan sementara dengan simpul denah yang sudah ada. Pin N dipasangkan sementara dengan CP3; dua tangkapan layar pengguna disimpan sebagai bukti.
- Transformasi geografis awal memakai tiga pasangan untuk peninjauan saja. Sudut basket dan gedung timur diproyeksikan sebagai lingkaran putus-putus opsional pada tab Prapemetaan citra, bukan dijadikan masukan kalibrasi yang telah dikonfirmasi.
- Transformasi tiga titik tidak memiliki titik uji independen. Kalibrasi GPS tetap mensyaratkan sedikitnya empat pasangan; koordinat yang sudutnya belum pasti tidak dimasukkan secara otomatis.
- Data transformasi hasil ekspor menyertakan pratinjau geografis beserta status `provisional-not-for-gps`.

## Draf denah atap — 28 Oktober 2026

- Menambahkan 21 poligon atap yang ditelusuri manual dari gambar udara pada `data/roof-plan.json`, terpisah dari denah utama.
- Menyediakan latar denah bersih, gambar udara, dan citra satelit; label, pembesaran, pemilihan atap, serta garis pembanding denah lama.
- Atap gabungan D–E dan F–UKS tidak dipecah menjadi ruang rekaan. A1 belum diidentifikasi pasti; ID R16–R21 tidak dianggap kode gedung resmi. Atap yang terpotong di batas bawah gambar belum ditelusuri.
- KU/K1/K2, dua taman, dan jalan bagian utara ditampilkan sebagai konteks visual. Batas ini bukan hasil survei atau penetapan kapasitas.
- Pencocokan ke citra satelit memakai transformasi enam pasangan visual yang sudah tersedia. Koordinat GPS tambahan tidak dipakai untuk mengesahkan bentuk atap.
- Ekspor `denah-atap.*`, `denah-atap-satelit.*`, dan `denah-atap-data.json` tersedia. Jalankan `npm run export:roof` setelah mengubah poligon.
