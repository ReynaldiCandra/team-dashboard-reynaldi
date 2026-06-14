'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Task {
  id: string
  user_id: string
  title: string
  done: boolean
  priority: 'high' | 'medium' | 'low'
  date: string
  created_at: string
}

const DEFAULT_TASKS = [
  { title: 'Follow-up leads HOT hari ini',     priority: 'high'   as const },
  { title: 'Kirim WA script ke leads WARM',    priority: 'medium' as const },
  { title: 'Update status leads di sistem',    priority: 'medium' as const },
  { title: 'Input performa harian',            priority: 'low'    as const },
]

export function useTasks(userId: string) {
  const [tasks, setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('user_id', userId).eq('date', today)
      .order('created_at')

    if (data && data.length === 0) {
      const defaults = DEFAULT_TASKS.map(t => ({ user_id: userId, title: t.title, done: false, priority: t.priority, date: today }))
      const { data: seeded } = await supabase.from('tasks').insert(defaults).select()
      setTasks((seeded as Task[]) ?? [])
    } else {
      setTasks((data as Task[]) ?? [])
    }
    setLoading(false)
  }, [userId, today])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const toggleTask = useCallback(async (taskId: string, done: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done } : t))
    await supabase.from('tasks').update({ done }).eq('id', taskId)
  }, [])

  const addTask = useCallback(async (title: string, priority: Task['priority'] = 'medium') => {
    const { data } = await supabase.from('tasks').insert({ user_id: userId, title, done: false, priority, date: today }).select().single()
    if (data) setTasks(prev => [...prev, data as Task])
  }, [userId, today])

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }, [])

  return { tasks, loading, toggleTask, addTask, deleteTask, refetch: fetchTasks }
}
