# Audit sumber — 20 Oktober 2026

Status: draf untuk peninjauan. Semua geometri merupakan penelusuran manual visual dari `Peta Jalur Evakuasi.jpg`. Koordinat menggunakan piksel pada gambar sumber, dengan batas pandang `[280,70,770,980]`. Tidak memakai meter, skala geografis, atau arah utara terverifikasi.

## Inventaris dan keputusan

| Sumber | Temuan | Perlakuan |
|---|---|---|
| Peta Jalur Evakuasi.jpg | Kode A–O dan A1, tiga lapangan, dua penanda sementara, garis hijau dan oranye | Acuan tapak dan potongan garis; kode tidak diterjemahkan menjadi nama ruang |
| Gemini_Generated_Image_.png dan varian (1) | Ilustrasi tampak udara; bentuk/segmen tidak sepenuhnya sama dengan peta berlabel | Referensi visual tambahan, tidak menjadi bukti akses; tidak dipublikasikan sebagai citra survei |
| Dokumen kajian risiko | Dua titik kumpul, lima jalur, daftar fasilitas, data bangunan bertingkat, ancaman prioritas | Daftar kebutuhan verifikasi; data kesehatan perorangan dan nomor pribadi tidak disalin |
| Presentasi SPAB | Slide 12 mengulang denah; slide risiko memberi konteks ancaman | Membantu istilah, bukan mengesahkan jalur |

Logo sekolah: PNG 634 × 634 berkanal alfa, diberikan langsung oleh pengguna pada percakapan ini. Disalin tanpa perubahan bentuk/warna ke `public/brand/logo-sman-1-gedeg.png` dan disematkan pada aplikasi, cetak, serta video.

## Konflik yang belum diselesaikan

1. Keterangan jalur utama menyebut lapangan terbuka, sedangkan arah garis hijau tampak menuju gerbang.
2. Dokumen memakai istilah lapangan depan/belakang; gambar memakai lapangan upacara/basket. Tidak diasumsikan padanannya.
3. Tabel sarpras menyebut kondisi ruang baik, sedangkan kajian kerentanan menyebut ruang rawan. Tidak diterbitkan sebagai status keselamatan per gedung.
4. Dokumen menyebut lima jalur evakuasi. Tujuh potongan yang ditelusuri di aplikasi hanyalah pemisahan visual garis, bukan pembetulan jumlah rute.
5. Gambar tampak udara menampilkan sejumlah tapak berbeda atau menyatu dibanding denah berlabel. Memindahkan kode ke foto tersebut akan memerlukan konfirmasi.
6. Penanda titik kumpul di luar tapak pada sisi atas gambar bisa merupakan bagian legenda. Tidak ditetapkan sebagai tujuan ketiga.
7. Data jumlah penghuni tidak cukup untuk menghitung kapasitas, waktu pengosongan, ataupun alokasi gedung ke titik kumpul.
8. Referensi kejadian dan tingkat risiko dalam dokumen belum diverifikasi secara eksternal; aplikasi tidak menerbitkannya sebagai hasil analisis risiko baru.

## Penelusuran geometri

Kode gedung: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, A1. Nama fungsi, pintu, dan tinggi seluruhnya belum diketahui. Bentuk berarsir `U1–U10` menunjukkan sebagian tapak tanpa kode pada sumber. Detail kecil yang tidak dapat ditelusuri jelas tidak ditambahkan; denah bukan inventaris bangunan lengkap.

- T1: potongan hijau sisi barat menuju area gerbang.
- T2: potongan hijau koridor barat bagian dalam; tidak ditetapkan sebagai pintu gedung.
- T3: potongan hijau sisi timur menuju area gerbang.
- T4: potongan oranye dari selatan ke bagian lapangan upacara.
- T5: potongan oranye dari barat ke lapangan upacara.
- T6 dan T7: potongan oranye dari koridor utara menuju lapangan.

Titik K1 dan K2 mengikuti posisi simbol pada sumber, dengan label sementara. Tidak menambahkan titik tujuan di ujung potongan garis, tidak menghubungkan garis ke gedung, dan tidak mengarang posisi ramp, tangga, APAR, atau hambatan.

## Data yang dibutuhkan sekolah

Gunakan `public/exports/lembar-verifikasi.csv` untuk mencatat nama gedung, posisi akses, kondisi akses, jenis ancaman, tujuan, kapasitas yang dinilai sekolah, dan bukti peninjauan. Bukti dapat berupa denah bertanda, foto akses, serta berita acara pemeriksaan. Penetapan keselamatan harus dilakukan pihak yang berwenang; implementasi ini hanya menyajikan dan memeriksa konsistensi data.
