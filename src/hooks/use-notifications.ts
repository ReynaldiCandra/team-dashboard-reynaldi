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

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`)
    }

    const { data, error } = await query
    if (error) console.error('fetchNotifications error:', error)
    setNotifications((data ?? []).map(r => mapRow(r as Record<string, unknown>)))
    setLoading(false)
  }, [userId]) // eslint-disable-line

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications]) // eslint-disable-line

  async function markAllRead() {
    if (!userId) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${userId},user_id.is.null`)
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
