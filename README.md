# Si-Admin

Sistem Administrasi dan Manajemen Bisnis - Dashboard untuk mengelola percakapan, follow up, feedback, dan stok barang.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM dengan SQLite

## Setup

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

## Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Jalankan linter
