"use client";
import { useMemo } from "react";
const COLORS=["#f87171","#60a5fa","#34d399","#fbbf24","#a78bfa","#f472b6","#fb923c"];
export function Confetti({ active }:{ active:boolean }) {
  const pieces=useMemo(()=>Array.from({length:30},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*0.6,dur:0.9+Math.random()*0.7,color:COLORS[i%COLORS.length],size:5+Math.random()*6,rot:Math.random()*360,isCircle:Math.random()>0.5})),[]);
  if(!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(900px) rotate(720deg);opacity:0}}`}</style>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:"-10px",width:p.size,height:p.size,backgroundColor:p.color,borderRadius:p.isCircle?"50%":"2px",animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,transform:`rotate(${p.rot}deg)`}}/>)}
    </div>
  );
}