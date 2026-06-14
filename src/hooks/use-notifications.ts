'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  userId?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

// Singleton — sesi tidak hilang antar render
const supabase = createClient()

function mapRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    title: row.title as string,
    message: row.message as string,
    type: (row.type as Notification['type']) ?? 'info',
    isRead: (row.is_read as boolean) ?? false,
    createdAt: row.created_at as string,
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return `${Math.floor(hrs / 24)} hari lalu`
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }

    // Pakai userId kalau valid UUID, fallback ke session user id
    const validUserId = userId && uuidRegex.test(userId) ? userId : session.user.id

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${validUserId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('fetchNotifications error:', error.message, '| code:', error.code, '| hint:', error.hint)
    }
    setNotifications((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel(`notifications-realtime-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  async function markAllRead() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const validUserId = userId && uuidRegex.test(userId) ? userId : session.user.id
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${validUserId},user_id.is.null`)
      .eq('is_read', false)
    if (!error) await fetchNotifications()
  }

  async function markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (!error) await fetchNotifications()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const notificationsWithTime = notifications.map(n => ({
    ...n,
    timeAgo: timeAgo(n.createdAt),
  }))

  return { notifications: notificationsWithTime, unreadCount, loading, markAllRead, markRead, fetchNotifications }
}
