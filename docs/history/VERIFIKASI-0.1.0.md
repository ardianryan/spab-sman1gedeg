# Hasil pemeriksaan — 20 Oktober 2026

Versi: **0.1.0-draft**. Pemeriksaan ini menilai implementasi dan konsistensi media, bukan keamanan jalur di lapangan.

## Hasil

| Pemeriksaan | Hasil |
|---|---|
| Skema data dan TypeScript | Lulus |
| Build Vite | Lulus |
| Tes data | 9 dari 9 lulus |
| Tes browser | 11 skenario pada masing-masing Chrome dan WebKit; seluruh 22 pemeriksaan lulus setelah perbaikan |
| Lebar layar | 360, 768, 1440 piksel tanpa overflow horizontal |
| Animasi | Gerak, jeda, ulangi, dan reduced motion lulus |
| Pemilihan dan skenario | Pilihan gedung bertahan saat berganti 2D/3D; jejak hilang saat memilih skenario tanpa rute |
| Keyboard dan dialog | Pemilihan melalui keyboard dan pengembalian fokus dialog lulus |
| Aksesibilitas otomatis | axe WCAG 2 A/AA dan 2.1 AA: tidak ada pelanggaran terdeteksi pada halaman utama |
| Kegagalan WebGL | Tombol kembali ke 2D tersedia; aplikasi tetap dapat dipakai |
| Logo | Aset PNG asli dari pengguna dimuat di header aplikasi dan disertakan dalam cetak/video |
| PDF A3/A4 | Masing-masing satu halaman; ukuran sesuai toleransi pembulatan browser; 116 operasi path vektor; teks wajib tersedia |
| Video utama | 1920 × 1080, 30 fps, 120 detik; dekode penuh tanpa galat |
| Video vertikal | 1080 × 1920, 30 fps, 50 detik; dekode penuh tanpa galat |
| Gerbang operasional | Menolak rilis, sebagaimana diharapkan untuk data belum disahkan |

Uji awal menemukan fokus dialog di WebKit dan kontras footer 4,2:1. Keduanya diperbaiki. Dua pengujian aksesibilitas terakhir dijalankan ulang setelah perubahan warna footer dan lulus; dua puluh pemeriksaan lain sudah lulus pada putaran sebelumnya. Pemeriksaan otomatis tidak menjamin seluruh kebutuhan aksesibilitas terpenuhi.

## Pemeriksaan visual

Tangkapan layar desktop, HP, dan 3D disimpan di `artifacts/`. PNG cetak ditinjau untuk memastikan label dan legenda berada dalam halaman. Cuplikan video horizontal dan vertikal menunjukkan logo, teks, peta, serta status draf tanpa pemotongan pada adegan yang diperiksa. Video memiliki teks tertanam dan takarir terpisah; tidak memiliki suara.

`artifacts/pdf-report.json` mencatat ukuran halaman dan keberadaan vektor. `artifacts/export-report.json` mencatat durasi, ukuran video, hasil dekode, ukuran berkas, dan SHA-256. `artifacts/video-render.json` mencatat susunan adegan dari versi data yang sama.

## Batas pengujian

- WebKit Playwright merupakan pengujian mesin browser, bukan Safari pada iPhone fisik.
- Belum ada uji lapangan, survei ukuran, simulasi kerumunan, atau pemeriksaan struktur bangunan.
- Semua rute operasional masih kosong. Tidak ada rute lengkap dari ruang, lantai, atau gedung yang disahkan.
- Model 3D sederhana memakai tinggi ilustratif dan belum menggambarkan interior.
- Posisi fasilitas dan bahaya yang tidak diketahui hanya disajikan sebagai teks.
- Tidak ada hosting atau publikasi yang dilakukan.
