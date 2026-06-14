"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, RefreshCw, ChevronDown } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  dark?: boolean;
  context?: string;
}

const MODELS = [
  { id: "gemini-flash",   label: "Gemini 1.5 Flash",   desc: "Cepat & efisien" },
  { id: "gemini-pro",     label: "Gemini 1.5 Pro",     desc: "Lebih cerdas" },
  { id: "gemini-flash-2", label: "Gemini 2.0 Flash",   desc: "Terbaru" },
]

const QUICK = [
  "Bagaimana performa tim bulan ini?",
  "Lead mana yang paling perlu di-follow-up sekarang?",
  "Strategi apa untuk meningkatkan closing minggu ini?",
  "Apa kelemahan utama tim dan cara mengatasinya?",
  "Berikan ringkasan performa dan rekomendasi prioritas.",
]

interface Message { role: "user" | "ai"; text: string }

export function AISummaryModal({ open, onClose, dark = false, context }: Props) {
  const [model, setModel]       = useState("gemini-flash");
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const [showModels, setShowModels] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus() }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages]);

  if (!open) return null;

  const bg   = dark ? "bg-[#0a1020]"   : "bg-white";
  const card = dark ? "bg-[#111d35]"   : "bg-slate-50";
  const tx   = dark ? "text-slate-100" : "text-slate-800";
  const mt   = dark ? "text-slate-400" : "text-slate-500";
  const bd   = dark ? "border-[#1e2d4a]" : "border-slate-200";
  const inp  = dark ? "bg-[#0a1020] border-[#1e2d4a] text-slate-100 placeholder:text-slate-500"
                    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400";

  async function sendMessage(q: string) {
    if (!q.trim() || loading) return;
    const userMsg = q.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg, context, model }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(p => [...p, { role: "ai", text: data.text }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setMessages(p => [...p, { role: "ai", text: `❌ Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  const selectedModel = MODELS.find(m => m.id === model)!;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-2xl sm:mx-4 ${bg} rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl`}
        style={{ height: "85vh", maxHeight: 680 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-opacity-10 shrink-0" style={{ borderColor: dark ? "#1e2d4a" : "#e2e8f0" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${tx}`}>Tanya Kecerdasan Tim</p>
            <p className={`text-xs ${mt}`}>AI Asisten Alexandria</p>
          </div>
          {/* Model selector */}
          <div className="relative">
            <button onClick={() => setShowModels(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${bd} ${tx} hover:opacity-80`}>
              <span className="text-purple-400">✦</span>
              {selectedModel.label}
              <ChevronDown size={11} className={`transition-transform ${showModels ? "rotate-180" : ""}`} />
            </button>
            {showModels && (
              <div className={`absolute right-0 top-full mt-1 ${dark ? "bg-[#111d35] border-[#1e2d4a]" : "bg-white border-slate-200"} border rounded-2xl shadow-xl z-10 min-w-[180px]`}>
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => { setModel(m.id); setShowModels(false); }}
                    className={`w-full text-left px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl text-xs hover:opacity-80 ${model === m.id ? "text-purple-400 font-bold" : tx}`}>
                    <p className="font-semibold">{m.label}</p>
                    <p className={`${mt} text-[10px]`}>{m.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? "bg-[#1e2d4a] text-slate-400" : "bg-slate-100 text-slate-500"}`}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2 pt-2">
              <p className={`text-xs ${mt} font-semibold mb-3`}>💡ertanyaan cepat:</p>
              {QUICK.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className={`w-full text-left text-xs px-4 py-2.5 rounded-xl border ${bd} ${card} ${tx} hover:border-purple-400 transition-colors`}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : `${card} ${tx} rounded-bl-sm border ${bd}`
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <RefreshCw size={12} className="text-white animate-spin" />
              </div>
              <div className={`${card} border ${bd} px-4 py-2.5 rounded-2xl rounded-bl-sm`}>
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={`px-4 pb-5 pt-3 border-t ${bd} shrink-0`}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Tanyakan sesuatu tentang performa tim..."
              rows={1}
              className={`flex-1 px-4 py-3 rounded-2xl border text-xs outline-none resize-none ${inp}`}
              style={{ maxHeight: 80 }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
