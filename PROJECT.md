# PROJECT.md — Log Mekanik

> **Lampirkan file ini setiap memulai sesi baru dengan Claude.**
> Claude tidak mengingat sesi sebelumnya. File ini adalah memori proyek.
> Perbarui di akhir setiap sesi, lalu push ke GitHub.

---

## 1. Tentang proyek

Aplikasi PWA pencatatan aktivitas harian mekanik untuk perusahaan yang bergerak di
**rental alat berat, core drilling, dan tambang wet nickel**.

Pengguna: mekanik junior sampai senior, foreman, planner/admin. Skala awal 20–50 orang.

Kondisi lapangan yang menentukan seluruh arsitektur:
**sering tanpa sinyal sama sekali, kadang berhari-hari.**
Karena itu aplikasi dibangun offline-first sejak baris kode pertama.

Unit yang dilayani: excavator, dozer, grader, compactor/bomag, wheel loader, dump truck,
water/fuel truck, light vehicle, light truck, genset, compressor, welding machine, pompa,
rig Jacro dan MD untuk core drilling, serta alat support lain.

---

## 2. Status saat ini

| Tahap | Isi | Status |
|---|---|---|
| 0 | Persiapan lingkungan (Node, Git, master unit) | dikerjakan pemilik proyek |
| 1 | Kerangka aplikasi + master unit lokal | **SELESAI** |
| 2 | Form input aktivitas | **SELESAI** |
| 3 | Riwayat, edit, foto → Milestone A | **SELESAI** |
| 3b | Laporan PDF & Excel dari IndexedDB | **SELESAI** (permintaan tambahan) |
| 4 | Backend Supabase + autentikasi | belum |
| 5 | Sinkronisasi naik (outbox) → Milestone B | belum |
| 6 | PWA pengerasan penuh | sebagian (manifest + service worker dasar sudah ada) |
| 7 | Panel admin web + export → Milestone C | belum |
| 8 | Uji lapangan terstruktur | belum |

Versi skema database lokal: **1**

---

## 3. Keputusan arsitektur yang sudah diambil

1. **Tanpa build step.** Vanilla HTML + CSS + JavaScript. Tidak ada npm install,
   tidak ada Vite, tidak ada bundler. Alasan: pemilik proyek belum punya dasar coding,
   dan aplikasi harus bisa dijalankan serta di-deploy tanpa toolchain.
   *Ini mengubah rencana awal yang menyebut Vite + React + Tailwind.*
2. **Library disimpan lokal di `lib/`**, bukan dari CDN. Alasan: aplikasi harus jalan
   penuh tanpa internet. Dexie, jsPDF, jsPDF-AutoTable, SheetJS.
3. **UUID dibuat di HP** (`crypto.randomUUID`), bukan auto-increment server.
   Wajib agar sinkronisasi Tahap 5 bersifat idempoten — kirim ulang tidak menghasilkan duplikat.
4. **Struktur tabel lokal identik dengan rencana tabel Supabase.** Saat Tahap 5 dibangun,
   data dikirim apa adanya tanpa konversi.
5. **Append-only untuk pembacaan meter.** Tidak pernah menimpa. Nilai berlaku = yang terbaru
   berdasarkan waktu. Mencegah tabrakan data saat dua mekanik mencatat unit yang sama offline.
6. **Dua timestamp per catatan**: `waktu_input_device` (jam HP, bisa dimanipulasi) dan
   nanti `waktu_terima_server`. Selisih ekstrem jadi bendera merah saat audit.
7. **Kolom `wo_id` dan `sync_status` sudah ada tapi belum dipakai.** Disiapkan untuk
   Fase 2 (Work Order) dan Tahap 5 (sinkronisasi). Mengisi kolom kosong lebih murah
   daripada migrasi tabel berisi ribuan baris.
8. **Foto dikompresi ke ~1280px / kualitas 0.7** sebelum disimpan. Tanpa ini penyimpanan
   HP mekanik penuh dalam hitungan minggu.
9. **Laporan dibuat di dalam HP**, bukan di server. Tidak butuh sinyal.

---

## 4. Struktur berkas

```
index.html            kerangka seluruh layar
manifest.json         konfigurasi PWA
sw.js                 service worker (versi dasar; pengerasan penuh di Tahap 6)
css/style.css         seluruh gaya tampilan
js/util.js            UUID, format tanggal/jam, CSV parser, toast, unduh
js/master-data.js     kategori unit, jenis pekerjaan, sistem komponen, status
js/db.js              seluruh akses IndexedDB (Dexie) + impor CSV + cadangan
js/photos.js          kamera, galeri, kompresi
js/report.js          pembuatan Excel dan PDF
js/screens.js         seluruh layar
js/app.js             navigasi, gerbang pengguna, panel bawah
lib/                  library pihak ketiga (jangan diubah)
icons/                ikon PWA
data/                 template CSV master unit
```

---

## 5. Skema database lokal — versi 1

```
sites          id, nama, aktif
users          id, nama, username, role, site_id, aktif
units          id, nomor_lambung, kategori, merk, model, serial_number, engine_number,
               tahun, tipe_meter, pemilik, customer_id, site_id, status, aktif
activity_logs  id, user_id, unit_id, tanggal, shift, jenis_pekerjaan, sistem, lokasi,
               jam_mulai, jam_selesai, jumlah_mekanik, catatan, status_pekerjaan,
               wo_id, sync_status, waktu_input_device, waktu_ubah
meter_readings id, unit_id, user_id, nilai, tipe_meter, waktu
attachments    id, activity_log_id, blob, nama, ukuran_byte, ukuran_asli_byte, sumber, waktu
settings       key, value
```

### ATURAN MIGRASI — jangan dilanggar
Selama mekanik sudah punya data di HP:
- **Boleh** menambah kolom baru.
- **Tidak boleh** menghapus kolom, mengganti nama kolom, atau mengubah tipe data.
- Setiap perubahan skema harus menaikkan `db.version(N)` di `js/db.js` dengan blok
  `.upgrade()` yang sesuai. Melewatkan ini akan menghapus data mekanik tanpa peringatan.
- Sebelum merilis versi baru ke mekanik, pastikan mereka sudah mengunduh cadangan.

---

## 6. Standar klasifikasi yang dipakai

Semua ada di `js/master-data.js`. Ubah di sana jika standar perusahaan berbeda.

- **Nomor lambung**: kode kategori + nomor urut (EX-012, DT-021, RG-004, GS-006, LV-008)
- **Jenis pekerjaan**: PS, PI, SR, UR, MD, TR, SG, SP
- **Status pekerjaan**: selesai, tunggu_part, tunggu_unit, lanjut_shift
- **Status unit**: RFU, BD, Service, Standby
- **Shift**: Pagi (07–19), Malam (19–07), Non-shift
- **Sistem/komponen**: berbeda untuk alat umum, rig drilling, dan genset

---

## 7. Yang BELUM ada — jangan dianggap sudah jalan

- Tidak ada server. Data hanya di HP masing-masing mekanik.
- Tidak ada login/password. Pemilihan pengguna hanya dropdown nama.
- Tidak ada sinkronisasi. Supervisor tidak bisa melihat data mekanik lain
  kecuali lewat file cadangan atau laporan yang diekspor.
- Tidak ada Work Order, jadwal PM otomatis, permintaan part, atau dashboard KPI.
- Tidak ada hak akses berjenjang. Semua pengguna punya kemampuan sama.

---

## 8. Rencana sesi berikutnya

Prioritas berurutan:
1. Uji coba mandiri 1 minggu oleh pemilik proyek (v0.1) → catat semua masalah.
2. Perbaikan berdasarkan uji coba, terutama bentuk form.
3. Uji 3 mekanik terpilih (v0.2) selama 2 minggu.
4. Tahap 4: Supabase + RLS + login PIN.
5. Tahap 5: sinkronisasi outbox.

Yang sengaja ditunda: Work Order, PM otomatis, dashboard KPI. Gerbangnya adalah
v1.0 berjalan stabil minimal 1 bulan.

---

## 9. Catatan sesi

| Tanggal | Yang dikerjakan | Catatan |
|---|---|---|
| 2026-08-01 | Tahap 1–3 + laporan PDF/Excel dibangun | Belum diuji di HP asli |
| | | |
