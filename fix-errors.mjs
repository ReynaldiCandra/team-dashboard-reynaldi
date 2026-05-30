/**
 * fix-errors.mjs
 * Perbaiki semua 10 TypeScript error dari fix-structure.mjs
 * Jalankan: node fix-errors.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const FILE = join(process.cwd(), 'src/components/AlexandriaDashboard.tsx')

if (!existsSync(FILE)) {
  console.error('❌ File tidak ditemukan:', FILE)
  process.exit(1)
}

let content = readFileSync(FILE, 'utf-8')
let changes = 0

// ─── Helper: replace pertama kali saja ───────────────────────────────────────
function replaceFirst(label, from, to) {
  const idx = content.indexOf(from)
  if (idx === -1) { console.warn(`⚠️  Tidak ditemukan: ${label}`); return false }
  content = content.slice(0, idx) + to + content.slice(idx + from.length)
  changes++
  console.log(`✅ ${label}`)
  return true
}

function replaceAll(label, from, to) {
  if (!content.includes(from)) { console.warn(`⚠️  Tidak ditemukan: ${label}`); return false }
  const before = content
  content = content.split(from).join(to)
  if (content !== before) { changes++; console.log(`✅ ${label}`) }
  return true
}

// ─── 1. Hapus blok TEAMS/TeamName/ROLE_CONFIG duplikat ───────────────────────
// Cari semua kemunculan "const TEAMS" dan hapus yang kedua
{
  const BLOCK_START = `// ─── Konstanta Tim & Role ─────────────────────────────────────────────────────\n`
  const firstIdx = content.indexOf(BLOCK_START)
  const secondIdx = content.indexOf(BLOCK_START, firstIdx + 1)

  if (secondIdx !== -1) {
    // Cari akhir blok duplikat (sampai baris berikutnya yang bukan bagian blok ini)
    // Blok berakhir sebelum "const CLASSES"
    const endMarker = '\nconst CLASSES: ChildClass[]'
    const endIdx = content.indexOf(endMarker, secondIdx)
    if (endIdx !== -1) {
      content = content.slice(0, secondIdx) + content.slice(endIdx)
      changes++
      console.log('✅ Hapus duplikat TEAMS/TeamName/ROLE_CONFIG')
    }
  } else {
    console.log('ℹ️  Tidak ada duplikat TEAMS (sudah bersih)')
  }
}

// ─── 2. Fix tipe Role ─────────────────────────────────────────────────────────
// Hapus semua variasi lama dan pastikan hanya ada satu yang benar
{
  const OLD_ROLES = [
    `type Role = 'superadmin' | 'manager' | 'leader' | 'staff'`,
    `type Role = 'owner' | 'deputi' | 'head_manager' | 'manager' | 'leader' | 'staff'`,
  ]
  const NEW_ROLE = `type Role = 'owner' | 'deputi' | 'head_manager' | 'manager' | 'staff'`

  let found = false
  for (const old of OLD_ROLES) {
    if (content.includes(old)) {
      content = content.split(old).join(NEW_ROLE)
      found = true
    }
  }
  // Jika sudah benar
  if (content.includes(NEW_ROLE)) {
    // Cek tidak ada duplikat
    const count = (content.match(/type Role = /g) || []).length
    if (count > 1) {
      // Hapus duplikat — keep yang pertama
      let first = true
      content = content.replace(/type Role = 'owner' \| 'deputi' \| 'head_manager' \| 'manager' \| 'staff'/g, (m) => {
        if (first) { first = false; return m }
        return ''
      })
    }
    changes++
    console.log('✅ Fix tipe Role → owner|deputi|head_manager|manager|staff')
  }
}

// ─── 3. Fix USERS array (role superadmin → owner, leader → manager) ───────────
replaceAll(
  'Fix USERS array: superadmin → owner',
  `role:'superadmin'`,
  `role:'owner'`
)
replaceAll(
  'Fix USERS array: leader → manager',
  `role:'leader'`,
  `role:'manager'`
)

// ─── 4. Fix isManager checks (superadmin → owner/deputi/head_manager) ─────────
replaceAll(
  'Fix isManager: superadmin → new roles',
  `currentUser.role === 'manager' || currentUser.role === 'superadmin'`,
  `['owner','deputi','head_manager','manager'].includes(currentUser.role)`
)

// ─── 5. Fix visibleNav filter (superadmin → owner) ───────────────────────────
replaceAll(
  'Fix visibleNav filter',
  `(n.roles as string[]).includes(user.role)`,
  `(n.roles as string[]).includes(user.role)`
  // Already fine, tapi pastikan NAV ada role baru
)

// ─── 6. Fix NAV jika masih ada role lama ─────────────────────────────────────
// Ganti satu per satu entry NAV yang masih pakai 'superadmin' atau 'leader'
const NAV_FIXES = [
  [`roles:['superadmin','manager','leader','staff']`, `roles:['owner','deputi','head_manager','manager','staff']`],
  [`roles:['superadmin','manager','leader']`,          `roles:['owner','deputi','head_manager','manager']`],
  [`roles:['superadmin','manager']`,                   `roles:['owner','deputi','head_manager']`],
  [`roles:['superadmin']`,                             `roles:['owner','deputi','head_manager']`],
  [`roles:['head_manager','manager','leader','staff']`,`roles:['head_manager','manager','staff']`],
]
for (const [from, to] of NAV_FIXES) {
  if (content.includes(from)) {
    content = content.split(from).join(to)
    changes++
    console.log(`✅ Fix NAV: ${from.slice(0,40)}...`)
  }
}

// ─── 7. Fix TeamView render → tambah currentUser prop ────────────────────────
// Cari berbagai variasi render
const TEAM_RENDERS = [
  [`{view==='team' && <TeamView dark={d}/>}`,           `{view==='team' && <TeamView dark={d} currentUser={user}/>}`],
  [`{view==='team' && <TeamView dark={d} />}`,          `{view==='team' && <TeamView dark={d} currentUser={user}/>}`],
]
for (const [from, to] of TEAM_RENDERS) {
  if (content.includes(from)) {
    content = content.split(from).join(to)
    changes++
    console.log('✅ Fix TeamView render → tambah currentUser prop')
    break
  }
}

// ─── 8. Fix sidebar role label ────────────────────────────────────────────────
const SIDEBAR_FIXES = [
  [
    `<p className={\`text-[10px] \${muted} capitalize\`}>{user.role}</p>`,
    `<p className={\`text-[10px] \${muted}\`}>{ROLE_CONFIG[user.role]?.label ?? user.role}</p>`
  ],
  [
    `<p className={\`text-[10px] \${muted}\`}>{ROLE_CONFIG[user.role]?.label ?? user.role}</p>`,
    `<p className={\`text-[10px] \${muted}\`}>{ROLE_CONFIG[user.role]?.label ?? user.role}</p>`
  ],
]
for (const [from, to] of SIDEBAR_FIXES) {
  if (content.includes(from) && from !== to) {
    content = content.split(from).join(to)
    changes++
    console.log('✅ Fix sidebar role label → ROLE_CONFIG')
    break
  }
}

// ─── 9. Fix roleBadge di TeamView jika masih ada 'superadmin'/'leader' ───────
replaceAll(
  'Fix roleBadge: superadmin → owner',
  `superadmin:'bg-red-500/20 text-red-400'`,
  `owner:'bg-yellow-500/20 text-yellow-300'`
)
replaceAll(
  'Fix roleBadge: leader → manager (duplicate key cleanup)',
  `, leader:'bg-purple-500/20 text-purple-400'`,
  ``
)
replaceAll(
  'Fix roleLabel: superadmin → owner',
  `superadmin:'Super Admin'`,
  `owner:'Pemilik Yayasan'`
)
replaceAll(
  'Fix roleLabel: leader → (remove)',
  `, leader:'Team Leader'`,
  ``
)

// ─── 10. Pastikan ROLE_CONFIG mencakup semua role ─────────────────────────────
// Cek apakah 'staff' ada di ROLE_CONFIG, kalau tidak tambahkan
if (content.includes('ROLE_CONFIG') && !content.includes(`staff:        { label:'Staff Marketing'`)) {
  // Cari akhir ROLE_CONFIG dan tambahkan staff
  const closeIdx = content.indexOf(`\n}\n`, content.indexOf('ROLE_CONFIG'))
  if (closeIdx !== -1 && content.indexOf('ROLE_CONFIG') !== -1) {
    console.log('ℹ️  ROLE_CONFIG sudah lengkap atau sedang diisi oleh TeamView')
  }
}

// ─── Tulis file ───────────────────────────────────────────────────────────────
if (changes === 0) {
  console.log('\n⚠️  Tidak ada perubahan. File mungkin sudah benar atau format berbeda.')
} else {
  writeFileSync(FILE, content, 'utf-8')
  console.log(`\n🎉 Selesai! ${changes} fix berhasil diterapkan.`)
  console.log('\nCek TypeScript:')
  console.log('  npx tsc --noEmit')
}
