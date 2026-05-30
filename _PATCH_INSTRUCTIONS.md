# Patch Manual untuk AlexandriaDashboard.tsx
# ============================================
# Karena AlexandriaDashboard.tsx > 2500 baris dan unik per repo,
# kamu perlu menambahkan 3 hal ini secara manual di Cursor.
# Estimasi waktu: 5 menit.

## Langkah A — Tambahkan import (di bagian PALING ATAS file)

```tsx
import MeetingProjectionPage from './pages/MeetingProjectionPage'
import HeadManagerView from './pages/HeadManagerView'
import RakornasPage from './pages/RakornasPage'
```

## Langkah B — Tambahkan menu di sidebar

Cari array yang berisi item navigasi sidebar (biasanya ada 'Leads', 'Performance', dsb).
Tambahkan item baru:

```tsx
{ id: 'meeting', label: 'Meeting Proyeksi', icon: Calendar },
{ id: 'rakornas', label: 'Rakornas Bulanan', icon: FileText },
```

Untuk Head Manager View — tambahkan di posisi pertama atau sebagai shortcut:
```tsx
{ id: 'head-manager', label: 'All Teams View', icon: LayoutGrid },
```

## Langkah C — Tambahkan routing di fungsi render

Cari bagian yang me-render halaman berdasarkan `activePage` atau `currentPage`.
Biasanya ada pola seperti:
  if (activePage === 'leads') return <LeadsPage />
  atau
  case 'performance': return <PerformancePage />

Tambahkan:
```tsx
case 'meeting':       return <MeetingProjectionPage />
case 'head-manager':  return <HeadManagerView />
case 'rakornas':      return <RakornasPage />
```

## Langkah D — Filter menu berdasarkan role (opsional tapi recommended)

Wrap item menu baru dengan pengecekan role:
```tsx
// Hanya tampil untuk head_manager dan manager
...(profile?.role !== 'staff' ? [
  { id: 'meeting', label: 'Meeting Proyeksi', icon: Calendar },
  { id: 'rakornas', label: 'Rakornas Bulanan', icon: FileText },
] : []),

// Hanya untuk head_manager
...(profile?.role === 'head_manager' ? [
  { id: 'head-manager', label: 'All Teams View', icon: LayoutGrid },
] : []),
```

## TIPS Cursor:
Ketik di Cursor Chat:
"Tambahkan import MeetingProjectionPage, HeadManagerView, dan RakornasPage
dari './pages/...' di AlexandriaDashboard.tsx,
lalu tambahkan routing untuk 'meeting', 'head-manager', dan 'rakornas'
di fungsi render halaman yang sudah ada,
dan tambahkan item menu baru di sidebar navigation array."
