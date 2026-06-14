"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function useStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    async function fetchStreak() {
      const supabase = createClient();
      const { data } = await supabase.from("activity_log").select("created_at").eq("user_id", userId).order("created_at", { ascending: false });
      if (!data) { setLoading(false); return; }
      const dates = [...new Set(data.map((r) => new Date(r.created_at).toISOString().split("T")[0]))].sort((a,b)=>b.localeCompare(a));
      let count = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const exp = new Date(today); exp.setDate(today.getDate() - i);
        if (dates[i] === exp.toISOString().split("T")[0]) count++;
        else break;
      }
      setStreak(count); setLoading(false);
    }
    fetchStreak();
  }, [userId]);
  return { streak, loading };
}