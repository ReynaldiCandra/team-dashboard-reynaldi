import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
