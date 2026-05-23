# Si-Admin

**Sistem Admin Multi-Fungsi** untuk mengelola operasional bisnis - mulai dari chat pelanggan, follow up, feedback, hingga manajemen stok barang. Dapat dikustomisasi untuk berbagai jenis usaha dan berbagai channel komunikasi.

---

## Fitur Utama

### 1. Manajemen Chat
- Tampilan split-panel (daftar percakapan + area chat)
- Cari dan filter percakapan berdasarkan status
- Balas pesan langsung dari dashboard
- Dukungan multi-channel (WhatsApp, Telegram, Email, dll.)

### 2. Follow Up
- Buat jadwal follow up ke pelanggan
- Tracking status otomatis: **Tertunda**, **Selesai**, **Terlambat**
- Prioritas tugas (Rendah / Sedang / Tinggi)
- Filter dan kelola semua follow up dalam satu tampilan

### 3. Feedback Pelanggan
- Kirim feedback/respons ke pelanggan
- Sistem rating bintang (1-5)
- Template feedback yang bisa dipakai ulang
- Riwayat semua feedback yang terkirim

### 4. Manajemen Stok Barang
- **Penerimaan stok** - Catat barang masuk
- **Pengecekan stok** - Lihat level inventori saat ini
- **Alert stok rendah** - Peringatan otomatis ketika stok di bawah batas minimum
- **Riwayat pergerakan** - Semua mutasi barang (masuk/keluar) tercatat
- Kategori stok yang bisa dikustomisasi

### 5. Kustomisasi Jenis Usaha
- Pilih tipe bisnis: **Retail**, **F&B**, **Jasa**, **Grosir**, atau kustom
- Profil bisnis yang bisa disesuaikan
- Kategori produk/stok fleksibel

### 6. Multi-Channel
- Kelola berbagai channel: WhatsApp, Telegram, Email, Instagram, SMS
- Aktifkan/nonaktifkan channel sesuai kebutuhan
- Pengaturan per channel

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Bahasa | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Komponen UI | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Ikon | [Lucide React](https://lucide.dev/) |
| Tanggal | [date-fns](https://date-fns.org/) |

---

## Struktur Proyek

```
Si-Admin/
├── prisma/
│   ├── schema.prisma      # Schema database
│   ├── seed.ts            # Data demo/seed
│   └── dev.db             # SQLite database (auto-generated)
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx           # Dashboard overview
│   │   │   ├── chat/             # Manajemen chat
│   │   │   ├── follow-up/       # Sistem follow up
│   │   │   ├── feedback/        # Feedback pelanggan
│   │   │   ├── stok/            # Manajemen stok
│   │   │   └── pengaturan/      # Pengaturan bisnis & channel
│   │   ├── api/                  # API routes
│   │   │   ├── chat/
│   │   │   ├── customers/
│   │   │   ├── feedback/
│   │   │   ├── follow-up/
│   │   │   ├── pengaturan/
│   │   │   └── stok/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/                   # Komponen shadcn/ui
│   └── lib/                      # Utilitas & Prisma client
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## Instalasi & Menjalankan

### Prasyarat

- **Node.js** v18 atau lebih baru
- **npm** v9+

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/NgajiKripto/Si-Admin.git
cd Si-Admin

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Buat database & tabel
npx prisma db push

# 5. Isi data demo (opsional tapi disarankan)
npx prisma db seed

# 6. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Perintah yang Tersedia

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Jalankan server development |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |
| `npx prisma studio` | Buka Prisma Studio (GUI database) |
| `npx prisma db seed` | Isi ulang data demo |

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/chat` | Daftar & buat percakapan |
| GET/PATCH | `/api/chat/[id]` | Detail & update percakapan |
| GET/POST | `/api/chat/[id]/messages` | Pesan dalam percakapan |
| GET | `/api/customers` | Daftar pelanggan |
| GET/POST | `/api/follow-up` | Daftar & buat follow up |
| PATCH/DELETE | `/api/follow-up/[id]` | Update & hapus follow up |
| GET/POST | `/api/feedback` | Daftar & kirim feedback |
| GET/POST | `/api/stok` | Daftar & tambah stok |
| PATCH | `/api/stok/[id]` | Update item stok |
| GET/POST | `/api/stok/movements` | Riwayat pergerakan stok |
| GET/POST/DELETE | `/api/stok/categories` | Kategori stok |
| GET/PATCH | `/api/pengaturan` | Profil bisnis |
| GET/POST/PATCH/DELETE | `/api/pengaturan/channels` | Manajemen channel |

---

## Database Schema

Aplikasi menggunakan **SQLite** dengan model utama:

- **BusinessProfile** - Profil dan tipe usaha
- **Channel** - Channel komunikasi (WhatsApp, Telegram, dll.)
- **Customer** - Data pelanggan
- **Conversation** & **Message** - Percakapan dan pesan
- **FollowUp** - Tugas follow up
- **Feedback** & **FeedbackTemplate** - Feedback dan template
- **StockCategory**, **StockItem**, **StockMovement** - Inventori dan mutasi

---

## Screenshot

> Jalankan `npm run dev` dan buka `http://localhost:3000` untuk melihat dashboard.

Halaman yang tersedia:
- `/` - Dashboard utama dengan metrik dan aktivitas terbaru
- `/chat` - Manajemen percakapan
- `/follow-up` - Sistem follow up
- `/feedback` - Feedback pelanggan
- `/stok` - Manajemen stok barang
- `/pengaturan` - Pengaturan bisnis dan channel

---

## Kustomisasi

### Mengubah Jenis Usaha

Buka halaman **Pengaturan** (`/pengaturan`) dan ubah tipe bisnis sesuai kebutuhan:
- Retail
- F&B (Food & Beverage)
- Jasa
- Grosir
- Kustom (tentukan sendiri)

### Menambah Channel Baru

Di halaman **Pengaturan**, tab **Channel**, klik tambah dan pilih tipe channel yang diinginkan. Setiap channel bisa diaktifkan/nonaktifkan secara independen.

### Menambah Kategori Stok

Di halaman **Pengaturan**, tab **Kategori**, tambahkan kategori baru sesuai jenis barang yang dijual.

---

## Lisensi

MIT

---

## Kontribusi

1. Fork repositori ini
2. Buat branch fitur (`git checkout -b fitur/fitur-baru`)
3. Commit perubahan (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur/fitur-baru`)
5. Buat Pull Request
