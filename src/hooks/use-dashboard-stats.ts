'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const SRC_COLORS: Record<string,string> = {
  Instagram:'#8b5cf6',WhatsApp:'#06b6d4',Referral:'#10b981',
  Facebook:'#3b82f6',Google:'#f59e0b','Walk-in':'#ec4899',Lainnya:'#94a3b8',
}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export function useDashboardStats() {
  const [data, setData] = useState({
    totalLeads:0, totalClosing:0, conversionRate:0,
    monthly:[] as {month:string;revenue:number;leads:number;closing:number;target:number}[],
    weekly:[] as {day:string;farhan:number;ramram:number}[],
    sources:[] as {name:string;value:number;color:string}[],
    leaderboard:[] as {rank:number;name:string;team:string;revenue:number;leads:number;closing:number;score:number;trend:string;avatar:string}[],
    todayLeads:0, todayClosing:0, loading:true, error:null as string|null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: leads, error } = await supabase
          .from('leads').select('id,source,status,assigned_to,created_at')
        if (error) throw error
        const all = leads ?? []
        const today = new Date().toISOString().split('T')[0]
        const totalLeads = all.length
        const totalClosing = all.filter(l => l.status === 'enrolled').length
        const conversionRate = totalLeads > 0 ? Math.round((totalClosing/totalLeads)*1000)/10 : 0
        const todayLeads = all.filter(l => l.created_at?.startsWith(today)).length
        const todayClosing = all.filter(l => l.status==='enrolled' && l.created_at?.startsWith(today)).length

        const srcCount: Record<string,number> = {}
        all.forEach(l => { const s=l.source||'Lainnya'; srcCount[s]=(srcCount[s]||0)+1 })
        const tot = all.length||1
        const sources = Object.entries(srcCount)
          .sort((a,b)=>b[1]-a[1])
          .map(([name,count])=>({name,value:Math.round((count/tot)*100),color:SRC_COLORS[name]||'#94a3b8'}))

        const now = new Date()
        const monthly = Array.from({length:6},(_,i)=>{
          const d = new Date(now.getFullYear(),now.getMonth()-5+i,1)
          const prefix = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
          const ml = all.filter(l=>l.created_at?.startsWith(prefix))
          return {month:MONTHS[d.getMonth()],leads:ml.length,closing:ml.filter(l=>l.status==='enrolled').length,revenue:0,target:30}
        })

        const weekly: {day:string;farhan:number;ramram:number}[] = []
        const c2 = new Date(now); let cnt=0
        while(cnt<5){
          c2.setDate(c2.getDate()-1); const dow=c2.getDay()
          if(dow===0||dow===6) continue
          const ds=c2.toISOString().split('T')[0]
          const dl=all.filter(l=>l.created_at?.startsWith(ds))
          weekly.unshift({day:DAYS_ID[dow],farhan:dl.filter(l=>l.assigned_to==='farhan').length,ramram:dl.filter(l=>l.assigned_to==='ramram').length})
          cnt++
        }

        const sm: Record<string,{leads:number;closing:number}> = {}
        all.forEach(l=>{const s=l.assigned_to||'?';if(!sm[s])sm[s]={leads:0,closing:0};sm[s].leads++;if(l.status==='enrolled')sm[s].closing++})
        const nm: Record<string,string> = {farhan:'Mr. Farhan',ramram:'Mr. Ramram'}
        const tm: Record<string,string> = {farhan:'Alpha',ramram:'Beta'}
        const leaderboard = Object.entries(sm)
          .map(([id,s])=>({name:nm[id]||id,team:tm[id]||'-',leads:s.leads,closing:s.closing,revenue:0,score:Math.round((s.closing/(s.leads||1))*100),trend:'up',avatar:(nm[id]||id).charAt(0).toUpperCase(),rank:0}))
          .sort((a,b)=>b.score-a.score).map((s,i)=>({...s,rank:i+1}))

        setData({totalLeads,totalClosing,conversionRate,monthly,weekly,sources,leaderboard,todayLeads,todayClosing,loading:false,error:null})
      } catch(e:any) {
        setData(p=>({...p,loading:false,error:e.message}))
      }
    }
    fetchStats()
  }, [])

  return data
}
