"use client";
import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "gemini-flash",    label: "Gemini 1.5 Flash" },
  { id: "gemini-pro",      label: "Gemini 1.5 Pro"   },
  { id: "gemini-flash-2",  label: "Gemini 2.0 Flash" },
];

const QUICK = [
  "Bagaimana performa tim bulan ini?",
  "Lead mana yang perlu di-follow-up sekarang?",
  "Strategi meningkatkan closing minggu ini?",
  "Ringkasan performa dan rekomendasi prioritas.",
];

interface Msg { role: "user" | "ai"; text: string }

export function MobileAIMarketing({ dark: d = false }: { dark?: boolean }) {
  const [model, setModel]     = useState("gemini-flash");
  const [input, setInput]     = useState("");
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const bg   = d ? "bg-[#0a1020]"     : "bg-slate-50";
  const card = d ? "bg-[#111d35]"     : "bg-white";
  const tx   = d ? "text-slate-100"   : "text-slate-800";
  const mt   = d ? "text-slate-400"   : "text-slate-500";
  const bd   = d ? "border-[#1e2d4a]" : "border-slate-200";

  async function send(q: string) {
    if (!q.trim() || loading) return;
    const text = q.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text }]);
    setLoading(true);
    try {
      const res  = await fetch("/api/ai-summary", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: text, model }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMsgs(p => [...p, { role: "ai", text: data.text }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setMsgs(p => [...p, { role: "ai", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={"flex-1 flex flex-col overflow-hidden " + bg}>
      {/* Model tabs */}
      <div className={"shrink-0 border-b " + bd + " " + card + " px-4 py-2 flex gap-2 overflow-x-auto"}>
        {MODELS.map(m => (
          <button key={m.id} onClick={() => setModel(m.id)}
            className={"shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors " + (
              model === m.id ? "bg-violet-600 text-white border-violet-600" : bd + " " + tx
            )}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="space-y-2 pt-1">
            <p className={"text-xs font-semibold mb-2 " + mt}>Pertanyaan cepat:</p>
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className={"w-full text-left text-xs px-4 py-3 rounded-xl border active:scale-95 transition-transform " + bd + " " + card + " " + tx}>
                {q}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "ai" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L14.91 8.26L12 2Z"/></svg>
              </div>
            )}
            <div className={"max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap " + (
              m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : card + " " + tx + " rounded-bl-sm border " + bd
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </div>
            <div className={"border px-4 py-2.5 rounded-2xl " + card + " " + bd}>
              <div className="flex gap-1">
                {[0,150,300].map(delay => (
                  <div key={delay} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: delay + "ms"}} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={"shrink-0 border-t px-4 pb-6 pt-3 " + card + " " + bd}>
        <div className="flex gap-2 items-end">
          <textarea ref={inputRef} value={input} rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Tanya tentang performa tim..."
            className={"flex-1 px-4 py-3 rounded-xl border text-xs outline-none resize-none " + (
              d ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder:text-slate-500"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
            )}
            style={{maxHeight: 80}} />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white disabled:opacity-40 shrink-0 active:scale-95 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
