# Log Mekanik

Aplikasi PWA pencatatan aktivitas harian mekanik alat berat, dump truck, genset,
dan rig core drilling. **Bekerja penuh tanpa sinyal.**

Tahap 1–3 selesai: input aktivitas, foto dokumentasi, riwayat, dan laporan PDF/Excel.
Belum ada server — semua data tersimpan di HP masing-masing.

---

## Cara menjalankan

Aplikasi ini tidak butuh `npm install` dan tidak ada proses build. Cukup file statis.

### Di komputer (untuk mencoba)

```bash
cd app
python3 -m http.server 8080
```
Buka `http://localhost:8080`.

Kalau punya Node.js:
```bash
npx serve app
```

> Jangan membuka `index.html` langsung lewat klik ganda (`file://`).
> Kamera, service worker, dan beberapa fungsi lain butuh `http://` atau `https://`.

### Di HP mekanik (cara sebenarnya)

1. Unggah isi folder `app/` ke Netlify (bisa dengan menyeret folder ke netlify.com/drop)
   atau Vercel, atau hosting statis apa pun.
2. Buka alamatnya di HP mekanik lewat Chrome (Android) atau Safari (iPhone).
3. Pilih menu browser → **Add to Home Screen** / **Tambahkan ke layar utama**.
4. Setelah itu aplikasi bisa dibuka dari ikon dan berjalan penuh tanpa sinyal.

---

## Langkah pertama setelah dipasang

1. Buka **Pengaturan** → isi nama perusahaan.
2. **Unduh template CSV**, isi daftar unit Anda, lalu **Impor unit dari CSV**.
   Atau tekan **Muat data contoh** kalau hanya ingin mencoba.
3. **Tambah mekanik** sesuai daftar tim Anda.
4. **Aktifkan penyimpanan tetap** agar browser tidak menghapus data saat memori menipis.
5. Mulai mencatat.

---

## Fitur

**Pencatatan**
- Form aktivitas dengan nilai bawaan otomatis (tanggal, shift, lokasi, mekanik)
- Pemilih unit dengan pencarian, filter kategori, dan riwayat unit terakhir dipakai
- Pembacaan HM/KM dengan validasi terhadap catatan terakhir
  (menolak nilai mundur, memperingatkan lonjakan tidak wajar)
- Jenis pekerjaan standar industri: PS, PI, SR, UR, MD, TR, SG, SP
- Sistem/komponen menyesuaikan kategori unit (alat berat, genset, rig bor berbeda)
- Catatan teks dan input suara

**Dokumentasi foto**
- Buka kamera langsung
- Ambil dari galeri (bisa beberapa sekaligus)
- Kompresi otomatis ke sekitar 200 KB per foto
- Maksimal 4 foto per catatan

**Laporan** — dibuat langsung dari data di HP, tanpa internet
- Excel `.xlsx` dengan 4 lembar: Aktivitas, Ringkasan, Pembacaan Meter, Master Unit
- PDF rekap: tabel aktivitas + halaman ringkasan
- PDF dokumentasi: satu blok per aktivitas lengkap dengan foto
- Bisa disaring per periode, per mekanik, per unit, per jenis pekerjaan

**Keamanan data**
- Cadangan JSON (dengan atau tanpa foto)
- Pemulihan dari file cadangan, mode ganti atau gabung

---

## PERINGATAN PENTING

**Belum ada server.** Selama Tahap 4–5 belum dibangun:

- Data hanya ada di HP masing-masing mekanik.
- Jika HP hilang, rusak, atau data browser dibersihkan, **catatan yang belum
  dicadangkan hilang permanen.**
- **Unduh cadangan minimal seminggu sekali** lewat Pengaturan.
- Batasi masa uji coba tanpa server maksimal 2–3 minggu.

**Catatan iOS.** Safari punya batasan lebih ketat daripada Chrome untuk penyimpanan
web. Pastikan aplikasi sudah ditambahkan ke layar utama dan penyimpanan tetap
sudah diaktifkan. Jangan pakai mode private.

---

## Struktur berkas

```
index.html        kerangka layar
manifest.json     konfigurasi PWA
sw.js             service worker
css/style.css     tampilan
js/util.js        fungsi bantu
js/master-data.js standar kategori, jenis pekerjaan, sistem
js/db.js          akses IndexedDB, impor CSV, cadangan
js/photos.js      kamera, galeri, kompresi
js/report.js      Excel dan PDF
js/screens.js     seluruh layar
js/app.js         navigasi
lib/              library pihak ketiga — jangan diubah
icons/            ikon aplikasi
data/             template CSV master unit
PROJECT.md        memori proyek — lampirkan setiap sesi baru dengan Claude
```

## Library

Dexie 4 (IndexedDB) · jsPDF 2.5 + AutoTable 3.8 (PDF) · SheetJS 0.18 (Excel).
Semuanya disimpan lokal di `lib/` agar aplikasi berjalan tanpa internet.
