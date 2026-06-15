"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, RefreshCw, ChevronDown, TrendingUp, Users, Target } from "lucide-react";

const MODELS = [
  { id: "gemini-flash",   label: "Gemini 1.5 Flash", desc: "Cepat & efisien" },
  { id: "gemini-pro",     label: "Gemini 1.5 Pro",   desc: "Lebih cerdas" },
  { id: "gemini-flash-2", label: "Gemini 2.0 Flash", desc: "Terbaru" },
];
const QUICK = [
  "Bagaimana performa tim bulan ini?",
  "Lead mana yang paling perlu di-follow-up sekarang?",
  "Strategi apa untuk meningkatkan closing minggu ini?",
  "Apa kelemahan utama tim dan cara mengatasinya?",
  "Berikan ringkasan performa dan rekomendasi prioritas.",
];
interface Msg { role: "user" | "ai"; text: string }
interface Props { dark?: boolean; currentUser?: unknown }

export function AIMarketingView({ dark: d = false }: Props) {
  const [model, setModel]       = useState("gemini-flash");
  const [input, setInput]       = useState("");
  const [msgs, setMsgs]         = useState<Msg[]>([]);
  const [loading, setLoading]   = useState(false);
  const [showM, setShowM]       = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const bg   = d ? "bg-[#0a1020]"     : "bg-slate-50";
  const card = d ? "bg-[#111d35]"     : "bg-white";
  const tx   = d ? "text-slate-100"   : "text-slate-800";
  const mt   = d ? "text-slate-400"   : "text-slate-500";
  const bd   = d ? "border-[#1e2d4a]" : "border-slate-200";

  async function send(q: string) {
    if (!q.trim() || loading) return;
    const text = q.trim(); setInput("");
    setMsgs(p => [...p, { role: "user", text }]);
    setLoading(true);
    try {
      const res  = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, model }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMsgs(p => [...p, { role: "ai", text: data.text }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setMsgs(p => [...p, { role: "ai", text: `❌ ${msg}` }]);
    } finally { setLoading(false); }
  }

  const sel = MODELS.find(m => m.id === model)!;

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border ${bd}`} style={{ height: "calc(100vh - 140px)", minHeight: 500 }}>
      {/* Header */}
      <div className={`${card} border-b ${bd} px-5 py-4 flex items-center gap-3 shrink-0`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className={`font-bold ${tx}`}>AI Marketing</p>
          <p className={`text-xs ${mt}`}>Asisten Cerdas Alexandria</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowM(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${bd} ${tx}`}>
            {sel.label}
            <ChevronDown size={11} className={`transition-transform ${showM ? "rotate-180" : ""}`} />
          </button>
          {showM && (
            <div className={`absolute right-0 top-full mt-1 z-20 ${d ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200"} border rounded-2xl shadow-xl min-w-[170px]`}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => { setModel(m.id); setShowM(false); }}
                  className={`w-full text-left px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl text-xs ${model === m.id ? "text-purple-400 font-bold" : tx}`}>
                  <p className="font-semibold">{m.label}</p>
                  <p className={`${mt} text-[10px]`}>{m.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      {msgs.length === 0 && (
        <div className={`${card} border-b ${bd} px-5 py-3 flex gap-2 shrink-0 flex-wrap`}>
          {[{ icon: TrendingUp, label: "Analisis Performa", color: "text-blue-500 bg-blue-50" },
            { icon: Users,       label: "Insight Tim",       color: "text-purple-500 bg-purple-50" },
            { icon: Target,      label: "Strategi Closing",  color: "text-green-500 bg-green-50" }]
            .map(({ icon: Icon, label, color }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${color}`}>
              <Icon size={13} />{label}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-5 py-4 space-y-3 ${bg}`}>
        {msgs.length === 0 && (
          <div className="space-y-2 pt-1">
            <p className={`text-xs font-semibold ${mt} mb-3`}>Pertanyaan cepat:</p>
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className={`w-full text-left text-xs px-4 py-2.5 rounded-xl border ${bd} ${card} ${tx} hover:border-purple-400 transition-colors`}>
                {q}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-purple-600 text-white rounded-br-sm" : `${card} ${tx} rounded-bl-sm border ${bd}`
            }`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <RefreshCw size={12} className="text-white animate-spin" />
            </div>
            <div className={`${card} border ${bd} px-4 py-2.5 rounded-2xl`}>
              <div className="flex gap-1">
                {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`${card} px-4 pb-4 pt-3 border-t ${bd} shrink-0`}>
        <div className="flex gap-2 items-end">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Tanyakan sesuatu tentang performa tim..." rows={1}
            className={`flex-1 px-4 py-3 rounded-xl border text-xs outline-none resize-none ${d ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"}`}
            style={{ maxHeight: 80 }} />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white disabled:opacity-40">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
