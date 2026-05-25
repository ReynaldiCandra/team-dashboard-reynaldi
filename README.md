# Alexandria Dashboard v2

Dashboard manajemen leads & performa marketing untuk Alexandria Islamic School.

## Fitur Utama

- **Form Input Lead 3 Bagian** — Data Orang Tua, Data Calon Siswa, Data Lead
- **Kategori Leads** — HOT 🔥 / WARM 🌤 / COLD ❄ / FREEZE 🧊 (FREEZE = follow-up 3 bulan kemudian)
- **Rating Ketertarikan** — Bintang 1–5
- **Export CSV** — 19 kolom, BOM UTF-8 (Excel-ready)
- **Copy WA Broadcast** — Salin daftar Hot & Warm ke clipboard
- **Copy Pesan WA Individual** — Generate pesan perkenalan per lead
- **Login Multi-Role** — superadmin / manager / leader / staff
- **Real-time** — Supabase Realtime untuk update instan
- **Dark / Light Mode** — Toggle tema

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS + Framer Motion + Lucide React
- **Charts**: Recharts

---

## Setup Lokal

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/alexandria-dashboard.git
cd alexandria-dashboard
npm install
```

### 2. Environment Variables

Salin file contoh:

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tiewqtujysbdityzubic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TG8gVy5oNLJz1mHxEQBfPg_8sLRe1us
SUPABASE_SERVICE_ROLE_KEY=<ambil dari Supabase Dashboard → Settings → API>
```

### 3. Setup Database Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com) → Project `tiewqtujysbdityzubic`
2. Klik **SQL Editor** → **New Query**
3. Paste isi file `supabase/schema.sql`
4. Klik **Run**

### 4. Buat Akun User

Di Supabase Dashboard → **Authentication** → **Users** → **Add User**:

| Email | Password | Nama | Role |
|---|---|---|---|
| `superadmin@alexandria.sch.id` | `Alexandria@2026!` | Super Admin | superadmin |
| `farhan@alexandria.sch.id` | `Farhan@2026!` | Mr. Farhan | staff |
| `ramram@alexandria.sch.id` | `Ramram@2026!` | Mr. Ramram |  staff |

Setelah user dibuat, jalankan SQL ini untuk update role:

```sql
UPDATE public.profiles SET role='superadmin', team='All'
  WHERE full_name ILIKE '%superadmin%' OR full_name ILIKE '%super%';

UPDATE public.profiles SET full_name='Mr. Farhan', role='staff', team='Alpha'
  WHERE full_name ILIKE '%farhan%';

UPDATE public.profiles SET full_name='Mr. Ramram', role='staff', team='Beta'
  WHERE full_name ILIKE '%ramram%';
```

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deploy ke Vercel

### Via Dashboard

1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Tambahkan **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy**

### Via CLI

```bash
npm i -g vercel
vercel --prod
```

---

## Struktur Folder

```
alexandria-dashboard/
├── src/
│   ├── app/
│   │   ├── login/page.tsx          # Halaman login
│   │   ├── dashboard/page.tsx      # Halaman dashboard
│   │   └── layout.tsx
│   ├── components/
│   │   └── AlexandriaDashboard.tsx # Komponen utama (semua views)
│   ├── hooks/
│   │   ├── use-auth.ts             # Auth hook (Supabase)
│   │   ├── use-leads.ts            # Leads CRUD + export helpers
│   │   └── use-performance.ts      # Performance hook
│   └── lib/
│       └── supabase/
│           ├── client.ts           # Browser client
│           └── server.ts           # Server client
├── supabase/
│   └── schema.sql                  # Schema lengkap — jalankan di SQL Editor
├── .env.local.example              # Template environment variables
└── README.md
```

---

## Form Input Lead — 3 Bagian

### Bagian 1: Data Orang Tua
- Nama Orang Tua
- Nomor WhatsApp
- Daerah (area domisili)

### Bagian 2: Data Calon Siswa
- Nama Calon Siswa
- Jenis Kelamin (toggle Laki-laki / Perempuan)
- Kelas yang Dituju
- Kakak/Adik di Sekolah (toggle Ya / Tidak)

### Bagian 3: Data Lead
- Sumber Lead (Instagram, WhatsApp, Referral, dll)
- Assign Staff (Mr. Farhan / Mr. Ramram)
- Kategori Leads: HOT / WARM / COLD / FREEZE
  - **FREEZE** = Data yang perlu follow-up 3 bulan kemudian
- Rating Ketertarikan 1–5 bintang
- Catatan

---

## Fitur Export & WA

| Fitur | Cara |
|---|---|
| **Export CSV** | Klik tombol "Export CSV" — download otomatis, 19 kolom, BOM UTF-8 (langsung bisa buka di Excel) |
| **Copy WA Broadcast** | Klik "Copy WA Broadcast" — salin daftar leads HOT & WARM ke clipboard, siap paste di WhatsApp |
| **Copy Pesan WA Individual** | Klik ikon 💬 di baris tabel atau tombol di modal detail — salin pesan perkenalan per lead |

---

## Akun Login Default

| Email | Password | Role |
|---|---|---|
| superadmin@alexandria.sch.id | Alexandria@2026! | Super Admin |
| farhan@alexandria.sch.id | Farhan@2026! | Staff (Mr. Farhan) |
| ramram@alexandria.sch.id | Ramram@2026! | Staff (Mr. Ramram) |

> Ganti password setelah pertama kali login via Supabase Dashboard → Authentication → Users

---

## Catatan Penting

- **FREEZE leads** secara otomatis diingatkan dengan keterangan "Follow-up 3 bulan kemudian" di tabel dan form
- **Export CSV** menghasilkan file dengan BOM UTF-8 sehingga karakter Indonesia (huruf beraksara) terbaca dengan benar di Excel
- **Realtime**: Data leads diperbarui otomatis tanpa perlu refresh halaman
