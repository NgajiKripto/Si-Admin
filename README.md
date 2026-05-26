<div align="center">

# Si-Admin

### Sistem Administrasi Cerdas untuk Customer Service

**Dashboard admin all-in-one dengan AI Agent berbasis LangChain/LangGraph untuk mengelola customer service secara profesional dan optimal.**

[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![LangChain](https://img.shields.io/badge/LangChain-1.4-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://js.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.3-1C3C3C?style=flat-square)](https://langchain-ai.github.io/langgraphjs/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

*AI Agent cerdas berbasis LangGraph yang belajar dari setiap interaksi, menggunakan tool calling, RAG pipeline, dan multi-agent orchestration untuk pelayanan customer service terbaik.*

[Quick Start](#quick-start) · [Fitur](#fitur) · [Arsitektur](#arsitektur) · [Agent Orchestration](#agent-orchestration-langgraph) · [API](#api-endpoints) · [Konfigurasi](#konfigurasi)

</div>

---

## Overview

Si-Admin adalah sistem administrasi cerdas yang dirancang khusus untuk bisnis kecil-menengah yang mengelola customer service di berbagai channel komunikasi. Berbeda dengan dashboard admin biasa, Si-Admin dilengkapi dengan AI Agent berbasis **LangChain.js** dan **LangGraph.js** yang mampu belajar dari setiap interaksi pelanggan, membangun memori persisten, dan terus meningkatkan kualitas respons secara otomatis.

Sistem ini mengintegrasikan manajemen percakapan, basis pengetahuan, sistem follow-up, inventori stok, dan feedback pelanggan dalam satu platform terpadu. Dengan arsitektur memori 4-tier (Working, Episodic, Semantic, Procedural) dan **RAG pipeline** berbasis vector embeddings, agent AI dapat memahami konteks percakapan secara mendalam dan memberikan respons yang relevan berdasarkan pengalaman sebelumnya.

Si-Admin menggunakan **LangGraph StateGraph** untuk orkestrasi agent dengan alur: guard_input, retrieve_context, llm_decide, execute_tool, dan guard_output. Sistem **multi-agent** dengan router LLM mendistribusikan tugas ke agent spesialis (CS, Stock, Follow-up). Dilengkapi knowledge graph untuk memahami relasi antar entitas, **hybrid search** yang menggabungkan BM25 + vector embeddings via Reciprocal Rank Fusion (RRF), **streaming SSE** untuk respons real-time, dan **human-in-the-loop** approval untuk aksi berdampak tinggi.

---

## Key Capabilities

| Capability | Deskripsi |
|:-----------|:----------|
| **LangGraph Orchestration** | StateGraph dengan alur guard_input -> retrieve_context -> llm_decide -> execute_tool -> guard_output |
| **Multi-Agent System** | Agent spesialis (CS, Stock, Follow-up) dengan LLM-based router |
| **RAG Pipeline** | Retrieval-Augmented Generation dengan vector embeddings + BM25 via RRF |
| **Tool Calling** | 6 LangChain tools: search-knowledge, check-stock, create-follow-up, get-customer-history, send-feedback-template, update-stock |
| **Streaming SSE** | Real-time token streaming untuk respons agent |
| **Human-in-the-Loop** | Admin approval untuk aksi berdampak tinggi (perubahan stok besar, follow-up prioritas tinggi) |
| **Vector Embeddings** | text-embedding-3-small untuk semantic search dengan Reciprocal Rank Fusion |
| **Memori 4-Tier** | Working, Episodic, Semantic, Procedural memory dengan konsolidasi LLM-powered |
| **Observability** | Token usage, latency, tool execution tracking, dan full request tracing |
| **Agent Guard** | Keamanan polyglot (Python + Shell + TypeScript) dengan input/output validation |
| **Basis Pengetahuan** | CRUD knowledge base dengan bulk import, pengujian agent, dan kategorisasi otomatis |
| **Self-Improvement** | Analisis pola interaksi, confidence scoring, dan koreksi admin |
| **Knowledge Graph** | Relasi entitas dan pemahaman kontekstual antar pelanggan, produk, dan kategori |
| **Multi-Channel** | Dukungan WhatsApp, Telegram, Email, dan Instagram |
| **Manajemen Stok** | Tracking inventori real-time dengan riwayat pergerakan barang |
| **Sistem Follow-Up** | Penjadwalan dan tracking follow-up pelanggan otomatis |
| **Feedback & Rating** | Pengumpulan dan analisis feedback dengan template respons |

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
│         /api/agent/chat  |  /api/agent/chat/stream (SSE)               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH STATE GRAPH                                   │
│                                                                           │
│   ┌─────────────┐   ┌──────────────────┐   ┌────────────┐               │
│   │ guard_input │──>│ retrieve_context │──>│ llm_decide │               │
│   │(Agent Guard)│   │  (RAG Pipeline)  │   │  (OpenAI)  │               │
│   └─────────────┘   └──────────────────┘   └─────┬──────┘               │
│                                                    │                      │
│                                          ┌────────┴────────┐             │
│                                          ▼                 ▼             │
│                                   ┌──────────────┐  ┌─────────────┐     │
│                                   │ execute_tool │  │   respond   │     │
│                                   │(Tool Calling)│  │  (Output)   │     │
│                                   └──────┬───────┘  └─────────────┘     │
│                                          │                               │
│                                          ▼                               │
│                                   ┌──────────────┐                       │
│                                   │ guard_output │                       │
│                                   │(Agent Guard) │                       │
│                                   └──────────────┘                       │
└───────────────────────────────────────────────────────────────────────────┘
                    │             │             │
                    ▼             ▼             ▼
┌───────────────────────┐ ┌─────────────┐ ┌──────────────────────────────┐
│   MULTI-AGENT SYSTEM  │ │   PRISMA    │ │      BASIS PENGETAHUAN       │
├───────────────────────┤ │   + SQLite  │ ├──────────────────────────────┤
│                       │ └─────────────┘ │  Knowledge CRUD              │
│  ┌─────────────────┐  │                 │  Vector Embeddings           │
│  │   LLM Router    │  │                 │  Bulk Import                 │
│  │  ┌───────────┐  │  │                 │  Agent Testing               │
│  │  │ CS Agent  │  │  │                 └──────────────────────────────┘
│  │  │Stock Agent│  │  │
│  │  │ FU Agent  │  │  │
│  │  └───────────┘  │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  Memory System  │  │
│  │  (4-Tier + LLM  │  │
│  │  Consolidation) │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │ Knowledge Graph │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  Hybrid Search  │──┼──► BM25 + Vector Embeddings (RRF)
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  Observability  │──┼──► Metrics, Traces, Token Usage
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
| LangGraph Orchestration | StateGraph orchestrated flow dengan guard nodes |
| Multi-Agent Router | LLM-based routing ke agent spesialis |
| Tool Calling | 6 tools: search-knowledge, check-stock, create-follow-up, get-customer-history, send-feedback-template, update-stock |
| RAG Pipeline | Retrieval-Augmented Generation dengan vector embeddings |
| Streaming SSE | Real-time token streaming via `/api/agent/chat/stream` |
| Human-in-the-Loop | Admin approval queue untuk aksi berdampak tinggi |
| Memory Panel | Kelola dan monitor memori 4-tier agent |
| LLM Consolidation | Konsolidasi memori otomatis berbasis LLM |
| Learning Panel | Pantau proses pembelajaran dan koreksi |
| Knowledge Graph | Visualisasi relasi antar entitas |
| Hybrid Search | Pencarian kontekstual dengan BM25 + Vector Embeddings (RRF) |
| Observability | Token usage, latency, tool calls, dan request tracing |

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

### Keamanan Agent (Agent Guard)

| Fitur | Layer | Deskripsi |
|:------|:------|:----------|
| Input Sanitization | Python + TypeScript | Deteksi dan pembersihan pola injeksi termasuk zero-width characters |
| Scope Enforcement | TypeScript | Pembatasan topik percakapan sesuai konfigurasi |
| Response Limiting | TypeScript | Pembatasan panjang dan token respons agent |
| Output Validation | Shell + TypeScript | Validasi output untuk mencegah kebocoran informasi sensitif |
| Action-Level Permissions | TypeScript + YAML | Kontrol granular aksi yang boleh dilakukan agent |
| Knowledge Audit | Python + TypeScript | Pemeriksaan konten knowledge base terhadap pola injeksi |
| Skill/File Scanning | Shell | Pemindaian file skill/knowledge terhadap pola berbahaya |
| Declarative Policies | YAML | Konfigurasi kebijakan keamanan dalam format deklaratif |
| Read-Only Mode | TypeScript | Mode darurat untuk memblokir semua aksi tulis agent |
| Polyglot Fallback | TypeScript | Fallback otomatis ke TS jika Python/Shell tidak tersedia |

### Arsitektur Agent Guard (Polyglot)

```
Input                                                           Output
  |                                                               ^
  v                                                               |
+---------------------------+    +-------------+    +-----------------------------+
| Python scan-input.py      |    | TypeScript  |    | Shell validate-output.sh    |
| (Pattern Analysis)        |--->| Scope Check |--->| (Output Validation)         |
+---------------------------+    | + Limiting  |    +-----------------------------+
                                 +------+------+
                                        |
                                        v
                                 +-------------+
                                 |     LLM     |
                                 +-------------+
```

**Layer-layer keamanan:**

| Layer | Bahasa | Fungsi |
|:------|:-------|:-------|
| Pattern Analysis | Python | Analisis pola injeksi, zero-width chars, delimiter injection |
| File Scanning | Shell (Bash) | Pemindaian file untuk shell injection, secret exfiltration, path traversal |
| Declarative Policies | YAML | Konfigurasi blocked patterns, allowed topics, action permissions, output rules |
| Orchestration + Fallback | TypeScript | Orkestrasi semua layer, scope check, response limiting, dan fallback otomatis |

**Penggunaan standalone (CLI/CI):**

```bash
# Scan input
echo '{"input": "test message"}' | python3 scripts/guard/scan-input.py

# Audit knowledge entry
echo '{"content": "knowledge text"}' | python3 scripts/guard/audit-knowledge.py

# Scan skill file
SCAN_TARGET=path/to/file.md bash scripts/guard/scan-skill.sh

# Validate output
echo '{"output": "agent response"}' | bash scripts/guard/validate-output.sh
```

> **Fallback:** Jika Python/Shell tidak tersedia di environment, sistem otomatis menggunakan implementasi TypeScript sebagai fallback tanpa downtime.

---

## Agent Orchestration (LangGraph)

Si-Admin menggunakan **LangGraph StateGraph** untuk mengorkestrasi alur kerja agent. Setiap request melewati serangkaian node yang terstruktur:

```
┌───────────────┐     ┌──────────────────┐     ┌────────────────┐
│  guard_input  │────>│ retrieve_context │────>│   llm_decide   │
│ (Sanitasi &   │     │ (RAG: Vector +   │     │ (GPT-4o-mini   │
│  Validasi)    │     │  BM25 via RRF)   │     │  Tool Calling) │
└───────────────┘     └──────────────────┘     └───────┬────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              ▼                   ▼
                                       ┌─────────────┐    ┌─────────────┐
                                       │execute_tool │    │  respond    │
                                       │(Guarded     │    │ (Langsung   │
                                       │ Tools)      │    │  jawab)     │
                                       └──────┬──────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ guard_output │
                                       │ (Validasi    │
                                       │  output)     │
                                       └──────────────┘
```

| Node | Fungsi |
|:-----|:-------|
| `guard_input` | Sanitasi input, deteksi injeksi, validasi scope |
| `retrieve_context` | Ambil konteks relevan via vector embeddings + BM25 (Reciprocal Rank Fusion) |
| `llm_decide` | LLM memutuskan apakah perlu tool call atau langsung menjawab |
| `execute_tool` | Eksekusi tool dengan Agent Guard enforcement |
| `guard_output` | Validasi output sebelum dikirim ke user |

### State Management

```typescript
interface AgentState {
  messages: BaseMessage[];
  context: RetrievedDocument[];
  toolCalls: ToolCall[];
  guardResult: GuardResult;
  sessionId: string;
}
```

---

## Multi-Agent System

Si-Admin mengimplementasikan arsitektur multi-agent dengan **LLM-based router** yang mendistribusikan request ke agent spesialis:

| Agent | Tugas | Tools |
|:------|:------|:------|
| **CS Agent** | Menjawab pertanyaan pelanggan, mencari knowledge base | search-knowledge, get-customer-history, send-feedback-template |
| **Stock Agent** | Mengelola informasi stok dan inventori | check-stock, update-stock |
| **Follow-up Agent** | Membuat dan mengelola follow-up pelanggan | create-follow-up, get-customer-history |

### Router

Router berbasis LLM menganalisis intent dari pesan masuk dan mendistribusikan ke agent yang paling tepat. Prompt router dirancang dalam Bahasa Indonesia untuk konteks CS lokal.

```
User Message ──> LLM Router ──┬──> CS Agent
                              ├──> Stock Agent
                              └──> Follow-up Agent
```

### Guarded Tools

Semua tools dibungkus dengan `guarded-tools.ts` yang memastikan:
- Agent Guard enforcement sebelum eksekusi tool
- Action-level permissions dari YAML policy
- Human approval untuk aksi berdampak tinggi (stok besar, follow-up prioritas tinggi)

---

## Streaming & Human-in-the-Loop

### SSE Streaming

Endpoint `/api/agent/chat/stream` menyediakan **Server-Sent Events** untuk real-time token streaming:

```
Client                          Server
  │                               │
  │── POST /api/agent/chat/stream ──>│
  │                               │
  │<── event: token ──────────────│  (per token)
  │<── event: token ──────────────│
  │<── event: tool_call ──────────│  (tool execution)
  │<── event: token ──────────────│
  │<── event: done ───────────────│  (selesai)
  │                               │
```

### Human-in-the-Loop Approval

Aksi berdampak tinggi memerlukan persetujuan admin melalui **HumanApprovalQueue**:

| Trigger | Contoh |
|:--------|:-------|
| Perubahan stok besar | Update stok > threshold yang dikonfigurasi |
| Follow-up prioritas tinggi | Follow-up dengan priority `HIGH` atau `URGENT` |
| Aksi sensitif lainnya | Sesuai konfigurasi YAML policy |

Alur approval:

1. Agent memutuskan aksi yang memerlukan approval
2. Request masuk ke `HumanApprovalQueue` (Prisma model)
3. Admin melihat queue di dashboard atau via `GET /api/agent/approval`
4. Admin approve/reject via `POST /api/agent/approval`
5. Jika approved, aksi dieksekusi; jika rejected, agent informed

---

## Observability & Metrics

Si-Admin menyediakan observability lengkap untuk setiap request agent:

### AgentMetrics (Per-Request)

| Metrik | Deskripsi |
|:-------|:----------|
| `totalTokens` | Total token yang digunakan (prompt + completion) |
| `promptTokens` | Token untuk prompt/context |
| `completionTokens` | Token untuk respons |
| `latencyMs` | Total latency request dalam milliseconds |
| `toolCalls` | Jumlah tool yang dipanggil |
| `toolNames` | Nama-nama tool yang dieksekusi |
| `model` | Model yang digunakan (e.g., gpt-4o-mini) |

### Callbacks

| Handler | Fungsi |
|:--------|:-------|
| `MetricsHandler` | Mengumpulkan token usage dan latency per-request |
| `TracingHandler` | Full request tracing untuk debugging |

### API Endpoints

- `GET /api/agent/metrics` - Performa 24 jam terakhir (aggregated)
- `GET /api/agent/metrics/traces` - Detail trace per-request untuk debugging

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
│       │   ├── approval/         # Human-in-the-loop approval queue
│       │   ├── chat/             # Agent chat + streaming (LangGraph)
│       │   │   └── stream/       # SSE streaming endpoint
│       │   ├── embeddings/       # Vector embedding management
│       │   ├── graph/            # Knowledge graph & relations
│       │   ├── health/           # Health monitoring
│       │   ├── learning/         # Self-improvement & learning
│       │   ├── memory/           # Memory system & consolidation
│       │   ├── metrics/          # Performance metrics & traces
│       │   │   └── traces/       # Per-request debug traces
│       │   └── search/           # Hybrid search (BM25 + Vector)
│       ├── chat/                 # Chat & conversation endpoints
│       ├── customers/            # Customer data
│       ├── feedback/             # Feedback & templates
│       ├── follow-up/            # Follow-up CRUD
│       ├── knowledge/            # Knowledge base CRUD & testing
│       ├── pengaturan/           # Settings, channels, categories
│       └── stok/                 # Stock & movement
├── components/ui/                # shadcn/ui components
└── lib/                          # Utilities & services
    ├── prisma.ts                 # Prisma client
    ├── utils.ts                  # cn helper
    └── langchain/                # LangChain/LangGraph AI system
        ├── config.ts             # OpenAI config (model, apiKey, temperature, maxIterations)
        ├── llm.ts                # LLM service layer
        ├── prompts.ts            # Indonesian CS agent prompt templates
        ├── embeddings.ts         # Vector embedding generation
        ├── embeddings-service.ts # Embedding CRUD & search service
        ├── consolidation.ts      # LLM-powered memory consolidation
        ├── tools/                # LangChain Tools
        │   ├── search-knowledge.ts
        │   ├── check-stock.ts
        │   ├── create-follow-up.ts
        │   ├── get-customer-history.ts
        │   ├── send-feedback-template.ts
        │   ├── update-stock.ts
        │   └── guarded-tools.ts  # Tools with Agent Guard enforcement
        ├── graph/                # LangGraph StateGraph
        │   ├── state.ts          # Graph state definition
        │   ├── nodes/            # Graph nodes (guard, retrieve, llm, tool, output)
        │   └── index.ts          # StateGraph compilation & export
        ├── agents/               # Multi-Agent System
        │   ├── cs-agent.ts       # Customer Service agent
        │   ├── stock-agent.ts    # Stock management agent
        │   ├── followup-agent.ts # Follow-up agent
        │   └── router.ts        # LLM-based agent router
        └── callbacks/            # Observability
            ├── metrics-handler.ts  # Token & latency tracking
            └── tracing-handler.ts  # Full request tracing

prisma/
├── schema.prisma                 # Database schema (17+ models)
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

### Pipeline Konsolidasi (LLM-Powered)

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
       │ (LLM analisis pola berulang)
       ▼
┌──────────────┐
│ Semantic Mem │ ──► Fakta diekstrak oleh LLM
└──────┬───────┘
       │ (LLM identifikasi pola respons berhasil)
       ▼
┌──────────────┐
│Procedural Mem│ ──► Best practices disimpan permanen
└──────────────┘
```

Konsolidasi memori menggunakan **LLM-powered analysis** (`src/lib/langchain/consolidation.ts`) untuk:
- Mengekstrak fakta penting dari percakapan episodik
- Mengidentifikasi pola respons yang berhasil
- Mempromosikan memori antar tier secara otomatis berdasarkan analisis LLM

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

## Hybrid Search (BM25 + Vector Embeddings)

Si-Admin menggunakan **Reciprocal Rank Fusion (RRF)** untuk menggabungkan dua metode pencarian:

| Metode | Teknologi | Kekuatan |
|:-------|:----------|:---------|
| **BM25** | Full-text search | Exact keyword matching, cepat untuk query spesifik |
| **Vector Embeddings** | text-embedding-3-small (OpenAI) | Semantic similarity, memahami makna dan konteks |

### Alur Hybrid Search

```
Query Masuk
     │
     ├──► BM25 Search ──────────► Ranked Results (keyword)
     │                                    │
     └──► Vector Search ─────────► Ranked Results (semantic)
          (text-embedding-3-small)        │
                                          ▼
                                 ┌─────────────────┐
                                 │ Reciprocal Rank │
                                 │ Fusion (RRF)    │
                                 └────────┬────────┘
                                          │
                                          ▼
                                  Final Ranked Results
```

### Vector Embeddings (Prisma Model)

Embeddings disimpan di model `VectorEmbedding` dan dikelola via:
- `POST /api/agent/embeddings` - Generate embeddings untuk knowledge entries
- `GET /api/agent/embeddings` - Lihat status embeddings
- Otomatis di-generate saat knowledge entry baru dibuat

---

## API Endpoints

### Agent AI (LangChain/LangGraph)

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `POST` | `/api/agent/chat` | Chat utama agent (LangGraph orchestrated) |
| `POST` | `/api/agent/chat/stream` | SSE streaming responses (real-time tokens) |
| `GET` | `/api/agent/approval` | Ambil antrian approval (Human-in-the-Loop) |
| `POST` | `/api/agent/approval` | Approve/reject aksi di antrian |
| `GET` | `/api/agent/embeddings` | Ambil data vector embeddings |
| `POST` | `/api/agent/embeddings` | Generate/update embeddings |
| `GET` | `/api/agent/metrics` | Performa agent 24 jam (aggregated) |
| `GET` | `/api/agent/metrics/traces` | Debug traces per-request |
| `GET` | `/api/agent/memory` | Ambil data memori agent |
| `POST` | `/api/agent/memory` | Simpan memori baru |
| `POST` | `/api/agent/memory/consolidate` | Jalankan konsolidasi memori (LLM-powered) |
| `GET` | `/api/agent/learning` | Ambil data pembelajaran |
| `POST` | `/api/agent/learning` | Tambah entri pembelajaran |
| `PUT` | `/api/agent/learning/[id]` | Update entri pembelajaran |
| `GET` | `/api/agent/graph` | Ambil data knowledge graph |
| `POST` | `/api/agent/graph` | Tambah node ke graph |
| `GET` | `/api/agent/graph/relations` | Ambil relasi antar node |
| `POST` | `/api/agent/graph/relations` | Buat relasi baru |
| `POST` | `/api/agent/search` | Hybrid search (BM25 + Vector Embeddings via RRF) |
| `GET` | `/api/agent/health` | Status kesehatan agent |

### Chat & Percakapan

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `GET` | `/api/chat` | Ambil daftar percakapan |
| `POST` | `/api/chat` | Buat percakapan baru |
| `GET` | `/api/chat/[conversationId]` | Ambil detail percakapan |

### Knowledge Base

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `GET` | `/api/knowledge` | Ambil daftar knowledge base |
| `POST` | `/api/knowledge` | Tambah entri knowledge |
| `GET` | `/api/knowledge/[id]` | Ambil detail knowledge |
| `PUT` | `/api/knowledge/[id]` | Update knowledge entry |
| `DELETE` | `/api/knowledge/[id]` | Hapus knowledge entry |
| `POST` | `/api/knowledge/test` | Uji respons agent |

### Follow-Up, Feedback, Stok, Pelanggan

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `GET` | `/api/customers` | Ambil daftar pelanggan |
| `GET` | `/api/feedback` | Ambil daftar feedback |
| `POST` | `/api/feedback` | Kirim feedback baru |
| `GET` | `/api/feedback/templates` | Ambil template feedback |
| `POST` | `/api/feedback/templates` | Buat template baru |
| `GET` | `/api/follow-up` | Ambil daftar follow-up |
| `POST` | `/api/follow-up` | Buat follow-up baru |
| `PUT` | `/api/follow-up/[id]` | Update follow-up |
| `DELETE` | `/api/follow-up/[id]` | Hapus follow-up |
| `GET` | `/api/stok` | Ambil daftar stok |
| `POST` | `/api/stok` | Tambah produk baru |
| `PUT` | `/api/stok/[id]` | Update produk |
| `DELETE` | `/api/stok/[id]` | Hapus produk |
| `POST` | `/api/stok/movement` | Catat pergerakan stok |

### Pengaturan

| Method | Path | Deskripsi |
|:-------|:-----|:----------|
| `GET` | `/api/pengaturan` | Ambil pengaturan sistem |
| `POST` | `/api/pengaturan` | Simpan pengaturan |
| `GET` | `/api/pengaturan/channels` | Ambil daftar channel |
| `POST` | `/api/pengaturan/channels` | Tambah/update channel |
| `GET` | `/api/pengaturan/categories` | Ambil daftar kategori |
| `POST` | `/api/pengaturan/categories` | Tambah kategori baru |

---

## Tech Stack

| Teknologi | Kegunaan |
|:----------|:---------|
| [Next.js 16](https://nextjs.org/) | Framework React dengan App Router dan API Routes |
| [TypeScript](https://www.typescriptlang.org/) | Type safety dan developer experience |
| [LangChain.js](https://js.langchain.com/) | Framework LLM: tools, prompts, chains, dan callbacks |
| [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) | StateGraph orchestration untuk alur agent |
| [OpenAI](https://openai.com/) | GPT-4o-mini (chat) dan text-embedding-3-small (embeddings) |
| [Zod](https://zod.dev/) | Runtime schema validation untuk tool parameters |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Komponen UI yang accessible dan customizable |
| [Prisma 7](https://www.prisma.io/) | ORM modern dengan type-safe database queries dan driver adapters |
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

# Setup environment variables
cp .env.example .env
# Edit .env dan isi OPENAI_API_KEY (wajib untuk fitur AI agent)

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk mengakses dashboard.

> **Catatan:** `OPENAI_API_KEY` diperlukan agar fitur AI agent (chat, embeddings, consolidation) dapat berfungsi. Tanpa API key, fitur non-AI (dashboard, CRUD, stok) tetap berjalan normal.

---

## Konfigurasi

| Variable | Default | Deskripsi |
|:---------|:--------|:----------|
| `DATABASE_URL` | `file:./dev.db` | Path ke database SQLite |
| `OPENAI_API_KEY` | - | **(Wajib)** API key OpenAI untuk LLM dan embeddings |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model LLM untuk chat dan tool calling |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Model untuk vector embeddings |
| `AGENT_TEMPERATURE` | `0.3` | Temperature LLM (0 = deterministik, 1 = kreatif) |
| `AGENT_MAX_ITERATIONS` | `10` | Maksimal iterasi tool calling per request |

File `.env` di root project:

```env
DATABASE_URL="file:./dev.db"

# OpenAI (Wajib untuk fitur AI)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

# Agent Configuration
AGENT_TEMPERATURE="0.3"
AGENT_MAX_ITERATIONS="10"
```

---

## Database Models (Prisma)

Selain model-model dasar (Customer, Conversation, Message, Knowledge, FollowUp, Stock, Feedback, dll.), Si-Admin menambahkan model baru untuk fitur AI agent:

| Model | Deskripsi |
|:------|:----------|
| `AgentMetrics` | Per-request observability data (tokens, latency, tool calls) |
| `VectorEmbedding` | Stored embeddings untuk semantic search |
| `AgentSession` | Sesi percakapan agent (session management) |
| `HumanApprovalQueue` | Antrian approval admin untuk aksi berdampak tinggi |

---

## Scripts

| Script | Deskripsi |
|:-------|:----------|
| `npm run dev` | Jalankan development server dengan hot reload |
| `npm run build` | Build aplikasi untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint untuk code quality |

---

## Deployment

### Prasyarat

Sebelum deploy, pastikan:

| Item | Keterangan |
|:-----|:-----------|
| `OPENAI_API_KEY` | Wajib untuk fitur AI agent |
| `ADMIN_SECRET` | Wajib untuk production (token autentikasi API admin) |
| SSL/HTTPS | Wajib agar header `x-admin-token` aman saat transit |
| Database | SQLite (VPS/Docker) atau Turso/PostgreSQL (serverless) |

### Option 1: VPS (DigitalOcean, Hetzner, AWS EC2)

Paling cocok untuk production karena filesystem persisten mendukung SQLite secara langsung.

```bash
# 1. SSH ke server
ssh root@your-server-ip

# 2. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone repository
git clone https://github.com/NgajiKripto/Si-Admin.git
cd Si-Admin
npm install

# 4. Setup environment
cp .env.example .env
# Edit .env: isi OPENAI_API_KEY dan ADMIN_SECRET

# 5. Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# 6. Build production
npm run build

# 7. Jalankan dengan PM2
npm install -g pm2
pm2 start npm --name "si-admin" -- start
pm2 save
pm2 startup
```

**Nginx Reverse Proxy:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL dengan Certbot:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

RUN mkdir -p /data
ENV DATABASE_URL="file:/data/si-admin.db"

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  si-admin:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ADMIN_SECRET=${ADMIN_SECRET}
      - DATABASE_URL=file:/data/si-admin.db
    volumes:
      - si-admin-data:/data
    restart: unless-stopped

volumes:
  si-admin-data:
```

```bash
# Deploy dengan Docker Compose
docker compose up -d

# Seed database (pertama kali)
docker compose exec si-admin npx prisma db seed
```

### Option 3: Vercel

> **Catatan:** SQLite tidak kompatibel dengan Vercel (serverless, filesystem ephemeral). Perlu migrasi ke database cloud seperti Turso atau PostgreSQL (Neon/Supabase).

**Langkah-langkah:**

1. Push repository ke GitHub
2. Buka [vercel.com](https://vercel.com), login dengan GitHub
3. Klik "Add New Project" dan pilih repository `Si-Admin`
4. Set environment variables di dashboard Vercel:
   ```
   OPENAI_API_KEY=sk-...
   ADMIN_SECRET=your-strong-secret-token
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   AGENT_TEMPERATURE=0.3
   AGENT_MAX_ITERATIONS=10
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-turso-token
   ```
5. Deploy

**Migrasi ke Turso (SQLite cloud):**

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login dan buat database
turso auth login
turso db create si-admin
turso db show si-admin --url
turso db tokens create si-admin
```

### Rekomendasi Platform

| Skenario | Platform | Alasan |
|:---------|:---------|:-------|
| Prototype/demo | VPS + SQLite | Paling murah, SQLite langsung jalan |
| Production kecil | VPS + Docker | Mudah maintain, persistent storage |
| Production scale | Vercel + Turso | Auto-scaling, zero ops |
| Self-hosted enterprise | Docker + PostgreSQL | Full control, database proper |

### Checklist Production

- [ ] Set `OPENAI_API_KEY` (valid dan memiliki saldo)
- [ ] Set `ADMIN_SECRET` (gunakan random string min. 32 karakter)
- [ ] HTTPS/SSL aktif
- [ ] Database sudah di-migrate (`npx prisma db push`)
- [ ] Backup strategy untuk database
- [ ] Monitor disk space (untuk SQLite)
- [ ] Rate limit sesuai kebutuhan traffic (default: 20 req/60s per IP)

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

**Dibangun dengan LangChain.js, LangGraph.js, dan OpenAI untuk pelayanan customer service terbaik.**

[Laporkan Bug](https://github.com/NgajiKripto/Si-Admin/issues) · [Request Fitur](https://github.com/NgajiKripto/Si-Admin/issues)

</div>
