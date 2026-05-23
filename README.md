<div align="center">

# Si-Admin

### Sistem Administrasi Cerdas untuk Customer Service

**Dashboard admin all-in-one dengan kecerdasan buatan untuk mengelola customer service secara profesional dan optimal.**

[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

*Dashboard admin cerdas yang belajar dari setiap interaksi untuk memberikan pelayanan customer service terbaik.*

[Quick Start](#quick-start) · [Fitur](#fitur) · [Arsitektur](#arsitektur) · [API](#api-endpoints) · [Konfigurasi](#konfigurasi)

</div>

---

## Overview

Si-Admin adalah sistem administrasi cerdas yang dirancang khusus untuk bisnis kecil-menengah yang mengelola customer service di berbagai channel komunikasi. Berbeda dengan dashboard admin biasa, Si-Admin dilengkapi dengan kecerdasan buatan yang mampu belajar dari setiap interaksi pelanggan, membangun memori persisten, dan terus meningkatkan kualitas respons secara otomatis.

Sistem ini mengintegrasikan manajemen percakapan, basis pengetahuan, sistem follow-up, inventori stok, dan feedback pelanggan dalam satu platform terpadu. Dengan arsitektur memori 4-tier (Working, Episodic, Semantic, Procedural), agent AI dapat memahami konteks percakapan secara mendalam dan memberikan respons yang relevan berdasarkan pengalaman sebelumnya.

Si-Admin juga dilengkapi dengan knowledge graph untuk memahami relasi antar entitas (pelanggan, produk, kategori) dan hybrid search yang menggabungkan BM25 dengan similarity scoring untuk pencarian yang akurat dan kontekstual. Fitur self-improvement memungkinkan sistem menganalisis pola interaksi, mengukur confidence score, dan menerima koreksi dari admin untuk terus berkembang.

---

## Key Capabilities

| Capability | Deskripsi |
|:-----------|:----------|
| **Basis Pengetahuan** | CRUD knowledge base dengan bulk import, pengujian agent, dan kategorisasi otomatis |
| **Memori 4-Tier** | Working, Episodic, Semantic, Procedural memory dengan konsolidasi otomatis |
| **Self-Improvement** | Analisis pola interaksi, confidence scoring, dan koreksi admin |
| **Knowledge Graph** | Relasi entitas dan pemahaman kontekstual antar pelanggan, produk, dan kategori |
| **Hybrid Search** | Kombinasi BM25 + similarity scoring untuk pencarian akurat |
| **Multi-Channel** | Dukungan WhatsApp, Telegram, Email, dan Instagram |
| **Manajemen Stok** | Tracking inventori real-time dengan riwayat pergerakan barang |
| **Sistem Follow-Up** | Penjadwalan dan tracking follow-up pelanggan otomatis |
| **Feedback & Rating** | Pengumpulan dan analisis feedback dengan template respons |
| **Agent Health Monitoring** | Dashboard kesehatan sistem AI dengan metrik performa |

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SI-ADMIN DASHBOARD                             │
├─────────────┬──────────────┬────────────┬──────────────┬───────────────┤
│    Chat     │  Follow-Up   │  Feedback  │     Stok     │  Pengaturan   │
└──────┬──────┴──────┬───────┴─────┬──────┴──────┬───────┴───────┬───────┘
       │             │             │             │               │
       ▼             ▼             ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES (Next.js)                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
┌───────────────────────┐ ┌─────────────┐ ┌──────────────────────────────┐
│   AGENT INTELLIGENCE  │ │   PRISMA    │ │      BASIS PENGETAHUAN       │
├───────────────────────┤ │   + SQLite  │ ├──────────────────────────────┤
│                       │ └─────────────┘ │  Knowledge CRUD              │
│  ┌─────────────────┐  │                 │  Bulk Import                 │
│  │  Memory System  │  │                 │  Agent Testing               │
│  │  ┌───────────┐  │  │                 └──────────────────────────────┘
│  │  │  Working  │  │  │
│  │  │  Episodic │  │  │
│  │  │  Semantic │  │  │
│  │  │ Procedural│  │  │
│  │  └───────────┘  │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │ Knowledge Graph │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  Self-Improve   │──┼──► Pattern Learning
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  Hybrid Search  │  │
│  └─────────────────┘  │
└───────────────────────┘
```

---

## Fitur

### Dashboard & Analitik

Halaman utama menampilkan ringkasan aktivitas customer service: total percakapan, follow-up tertunda, feedback terbaru, dan status stok. Memberikan gambaran cepat tentang kesehatan operasional bisnis.

### Basis Pengetahuan (Knowledge Base)

| Fitur | Deskripsi |
|:------|:----------|
| CRUD Knowledge | Tambah, edit, hapus, dan lihat entri pengetahuan |
| Bulk Import | Import banyak entri sekaligus dari format terstruktur |
| Kategorisasi | Organisasi pengetahuan berdasarkan kategori |
| Preview & Stats | Pratinjau konten dan statistik penggunaan |
| Agent Testing | Uji respons agent berdasarkan knowledge base |

### Kecerdasan Agent (Agent Intelligence)

| Fitur | Deskripsi |
|:------|:----------|
| Memory Panel | Kelola dan monitor memori 4-tier agent |
| Learning Panel | Pantau proses pembelajaran dan koreksi |
| Knowledge Graph | Visualisasi relasi antar entitas |
| Hybrid Search | Pencarian kontekstual dengan BM25 + similarity |
| Health Dashboard | Monitor kesehatan dan performa agent AI |

### Manajemen Chat

| Fitur | Deskripsi |
|:------|:----------|
| Daftar Percakapan | Lihat semua percakapan pelanggan |
| Detail Pesan | Baca riwayat pesan per percakapan |
| Input Pesan | Kirim respons ke pelanggan |
| Multi-Channel | Dukungan berbagai platform komunikasi |

### Sistem Follow-Up

| Fitur | Deskripsi |
|:------|:----------|
| Penjadwalan | Atur jadwal follow-up otomatis |
| Kalender | Tampilan kalender untuk follow-up |
| Daftar Tugas | List follow-up berdasarkan status |
| CRUD | Buat, edit, selesaikan, dan hapus follow-up |

### Manajemen Stok

| Fitur | Deskripsi |
|:------|:----------|
| Daftar Produk | Lihat semua produk dan stok |
| Tambah/Edit Produk | Kelola data produk |
| Pergerakan Stok | Catat masuk/keluar barang |
| Alert Stok Rendah | Peringatan saat stok menipis |

### Feedback & Rating

| Fitur | Deskripsi |
|:------|:----------|
| Kumpulkan Feedback | Form pengumpulan feedback pelanggan |
| Template Respons | Template balasan untuk feedback umum |
| Analisis Rating | Lihat tren rating dari waktu ke waktu |

---

## Arsitektur

```
src/
├── app/
│   ├── (dashboard)/              # Halaman dashboard (route group)
│   │   ├── chat/                 # Manajemen percakapan
│   │   │   └── components/       # ConversationList, MessageView, MessageInput
│   │   ├── feedback/             # Sistem feedback & rating
│   │   │   └── components/       # FeedbackForm, FeedbackTemplates
│   │   ├── follow-up/            # Penjadwalan follow-up
│   │   │   └── components/       # FollowUpList, FollowUpForm, Calendar
│   │   ├── kecerdasan/           # Kecerdasan Agent (AI Intelligence)
│   │   │   └── components/       # MemoryPanel, LearningPanel, GraphPanel, etc.
│   │   ├── pengaturan/           # Pengaturan sistem
│   │   │   └── components/       # BusinessProfile, Channels, Categories
│   │   ├── pengetahuan/          # Basis Pengetahuan (Knowledge Base)
│   │   │   └── components/       # KnowledgeForm, List, BulkImport, etc.
│   │   ├── stok/                 # Manajemen inventori
│   │   │   └── components/       # StockList, StockForm, StockMovement
│   │   ├── layout.tsx            # Sidebar navigation layout
│   │   └── page.tsx              # Halaman utama dashboard
│   └── api/                      # API Routes
│       ├── agent/                # Agent intelligence endpoints
│       │   ├── graph/            # Knowledge graph & relations
│       │   ├── health/           # Health monitoring
│       │   ├── learning/         # Self-improvement & learning
│       │   ├── memory/           # Memory system & consolidation
│       │   └── search/           # Hybrid search
│       ├── chat/                 # Chat & conversation endpoints
│       ├── customers/            # Customer data
│       ├── feedback/             # Feedback & templates
│       ├── follow-up/            # Follow-up CRUD
│       ├── knowledge/            # Knowledge base CRUD & testing
│       ├── pengaturan/           # Settings, channels, categories
│       └── stok/                 # Stock & movement
├── components/ui/                # shadcn/ui components
└── lib/                          # Utilities (Prisma client, cn helper)

prisma/
├── schema.prisma                 # Database schema (13+ models)
├── seed.ts                       # Sample data seeder
└── dev.db                        # SQLite database
```

---

## Sistem Memori 4-Tier

| Tier | Nama | Deskripsi | Decay Rate |
|:-----|:-----|:----------|:-----------|
| 1 | **Memori Kerja (Working)** | Konteks percakapan aktif yang sedang berlangsung | Tinggi - hilang setelah sesi |
| 2 | **Memori Episodik (Episodic)** | Ringkasan interaksi sebelumnya dengan pelanggan | Sedang - memudar seiring waktu |
| 3 | **Memori Semantik (Semantic)** | Fakta umum tentang pelanggan, produk, dan preferensi | Rendah - bertahan lama |
| 4 | **Memori Prosedural (Procedural)** | Pola respons yang terbukti berhasil dan efektif | Sangat rendah - permanen |

### Pipeline Konsolidasi

```
Percakapan Baru
      │
      ▼
┌──────────────┐
│ Working Mem  │ ──► Konteks aktif sesi ini
└──────┬───────┘
       │ (setelah sesi berakhir)
       ▼
┌──────────────┐
│ Episodic Mem │ ──► Ringkasan interaksi disimpan
└──────┬───────┘
       │ (analisis pola berulang)
       ▼
┌──────────────┐
│ Semantic Mem │ ──► Fakta diekstrak dan disimpan
└──────┬───────┘
       │ (pola respons berhasil teridentifikasi)
       ▼
┌──────────────┐
│Procedural Mem│ ──► Best practices disimpan permanen
└──────────────┘
```

---

## Self-Improvement

Sistem self-improvement Si-Admin bekerja dalam loop berkelanjutan:

1. **Observasi** - Agent mencatat setiap interaksi dan respons yang diberikan
2. **Analisis Pola** - Sistem mengidentifikasi pola dari interaksi yang berhasil vs gagal
3. **Confidence Scoring** - Setiap pengetahuan diberi skor kepercayaan berdasarkan efektivitas
4. **Koreksi Admin** - Admin dapat memberikan koreksi langsung yang langsung meningkatkan confidence
5. **Adaptasi** - Agent menyesuaikan respons berdasarkan pembelajaran terbaru

| Komponen | Fungsi |
|:---------|:-------|
| Pattern Analysis | Mengidentifikasi pola interaksi yang berhasil |
| Confidence Score | Mengukur tingkat kepercayaan setiap knowledge entry |
| Admin Corrections | Menerima dan menerapkan koreksi dari admin |
| Learning Rate | Mengontrol kecepatan adaptasi agent |
| Feedback Loop | Menggunakan rating pelanggan sebagai sinyal pembelajaran |

---

## API Endpoints

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `GET` | `/api/chat` | Ambil daftar percakapan |
| `POST` | `/api/chat` | Buat percakapan baru |
| `GET` | `/api/chat/[conversationId]` | Ambil detail percakapan |
| `GET` | `/api/customers` | Ambil daftar pelanggan |
| `GET` | `/api/feedback` | Ambil daftar feedback |
| `POST` | `/api/feedback` | Kirim feedback baru |
| `GET` | `/api/feedback/templates` | Ambil template feedback |
| `POST` | `/api/feedback/templates` | Buat template baru |
| `GET` | `/api/follow-up` | Ambil daftar follow-up |
| `POST` | `/api/follow-up` | Buat follow-up baru |
| `PUT` | `/api/follow-up/[id]` | Update follow-up |
| `DELETE` | `/api/follow-up/[id]` | Hapus follow-up |
| `GET` | `/api/knowledge` | Ambil daftar knowledge base |
| `POST` | `/api/knowledge` | Tambah entri knowledge |
| `GET` | `/api/knowledge/[id]` | Ambil detail knowledge |
| `PUT` | `/api/knowledge/[id]` | Update knowledge entry |
| `DELETE` | `/api/knowledge/[id]` | Hapus knowledge entry |
| `POST` | `/api/knowledge/test` | Uji respons agent |
| `GET` | `/api/agent/memory` | Ambil data memori agent |
| `POST` | `/api/agent/memory` | Simpan memori baru |
| `POST` | `/api/agent/memory/consolidate` | Jalankan konsolidasi memori |
| `GET` | `/api/agent/learning` | Ambil data pembelajaran |
| `POST` | `/api/agent/learning` | Tambah entri pembelajaran |
| `PUT` | `/api/agent/learning/[id]` | Update entri pembelajaran |
| `GET` | `/api/agent/graph` | Ambil data knowledge graph |
| `POST` | `/api/agent/graph` | Tambah node ke graph |
| `GET` | `/api/agent/graph/relations` | Ambil relasi antar node |
| `POST` | `/api/agent/graph/relations` | Buat relasi baru |
| `POST` | `/api/agent/search` | Hybrid search (BM25 + similarity) |
| `GET` | `/api/agent/health` | Status kesehatan agent |
| `GET` | `/api/pengaturan` | Ambil pengaturan sistem |
| `POST` | `/api/pengaturan` | Simpan pengaturan |
| `GET` | `/api/pengaturan/channels` | Ambil daftar channel |
| `POST` | `/api/pengaturan/channels` | Tambah/update channel |
| `GET` | `/api/pengaturan/categories` | Ambil daftar kategori |
| `POST` | `/api/pengaturan/categories` | Tambah kategori baru |
| `GET` | `/api/stok` | Ambil daftar stok |
| `POST` | `/api/stok` | Tambah produk baru |
| `PUT` | `/api/stok/[id]` | Update produk |
| `DELETE` | `/api/stok/[id]` | Hapus produk |
| `POST` | `/api/stok/movement` | Catat pergerakan stok |

---

## Tech Stack

| Teknologi | Kegunaan |
|:----------|:---------|
| [Next.js 16](https://nextjs.org/) | Framework React dengan App Router dan API Routes |
| [TypeScript](https://www.typescriptlang.org/) | Type safety dan developer experience |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Komponen UI yang accessible dan customizable |
| [Prisma 5](https://www.prisma.io/) | ORM modern dengan type-safe database queries |
| [SQLite](https://www.sqlite.org/) | Database ringan tanpa konfigurasi server |
| [Lucide React](https://lucide.dev/) | Icon library modern dan konsisten |

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/NgajiKripto/Si-Admin.git
cd Si-Admin

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk mengakses dashboard.

---

## Konfigurasi

| Variable | Default | Deskripsi |
|:---------|:--------|:----------|
| `DATABASE_URL` | `file:./dev.db` | Path ke database SQLite |

File `.env` di root project:

```env
DATABASE_URL="file:./dev.db"
```

---

## Scripts

| Script | Deskripsi |
|:-------|:----------|
| `npm run dev` | Jalankan development server dengan hot reload |
| `npm run build` | Build aplikasi untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint untuk code quality |

---

## Kontribusi

Kontribusi sangat diterima! Berikut panduan singkat:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur/fitur-baru`)
3. Commit perubahan (`git commit -m 'feat: tambah fitur baru'`)
4. Push ke branch (`git push origin fitur/fitur-baru`)
5. Buat Pull Request

### Panduan Umum

- Gunakan Bahasa Indonesia untuk label UI dan deskripsi
- Ikuti konvensi penamaan yang sudah ada
- Pastikan `npm run build` dan `npm run lint` berhasil sebelum submit PR
- Tambahkan API route di `src/app/api/` dengan pola NextRequest/NextResponse
- Komponen halaman ditempatkan di folder `components/` yang bersesuaian

---

<div align="center">

**Dibangun dengan kecerdasan buatan untuk pelayanan terbaik.**

[Laporkan Bug](https://github.com/NgajiKripto/Si-Admin/issues) · [Request Fitur](https://github.com/NgajiKripto/Si-Admin/issues)

</div>
