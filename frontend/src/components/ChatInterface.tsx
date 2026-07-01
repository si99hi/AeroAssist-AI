import { useState } from "react";

const SUGGESTIONS = [
  "Why is AI101 delayed?",
  "Can I carry pets in cabin on Air India?",
  "What is the weather at DEL?",
  "Can I rebook after cancellation on AI302?",
];

interface Props {
  onSend: (question: string) => Promise<void>;
  messages: { role: string; content: string; tools?: string[]; citations?: Record<string, string | number>[] }[];
  loading: boolean;
}

export default function ChatInterface({ onSend, messages, loading }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    await onSend(q);
  };

  return (
    <div className="flex flex-col h-full justify-between flex-1">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 min-h-[450px] pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-[#E53935]/5 flex items-center justify-center text-[#E53935] font-bold text-xl mb-4">
              AI
            </div>
            <h2 className="text-xl font-bold text-[#111111] mb-2">How can I assist you today?</h2>
            <p className="text-sm text-[#666666] max-w-sm mb-8">
              Ask me about flight status, weather updates, or specific Air India policy guidelines.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSend(q)}
                  disabled={loading}
                  className="text-xs px-4 py-2.5 rounded-full border border-[#F1F1F1] bg-[#FAFAFA] text-[#666666] hover:bg-[#E53935]/5 hover:text-[#E53935] hover:border-[#E53935]/20 font-medium transition duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed border ${
                  isUser
                    ? "bg-[#FAFAFA] border-[#F1F1F1] text-[#111111] rounded-tr-sm shadow-subtle"
                    : "bg-white border-[#F1F1F1] text-[#111111] rounded-tl-sm shadow-soft"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F1F1F1] flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#999999] mr-1">System tools:</span>
                    {msg.tools.map((tool) => (
                      <span key={tool} className="inline-block bg-[#E53935]/5 border border-[#E53935]/15 text-[#E53935] font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F1F1F1]">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#999999] mb-1.5">References & Citations:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, idx) => (
                        <div key={idx} className="bg-[#FAFAFA] border border-[#F1F1F1] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-[#666666]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]"></span>
                          <span className="font-semibold text-[#111111]">{c.document}</span>
                          {c.page && <span className="text-[#999999]">p.{c.page}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#999999] pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E53935] animate-ping"></div>
            <span>Analyzing system resources & policies...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about flights, weather, or Air India policies..."
          className="w-full bg-[#FAFAFA] border border-[#F1F1F1] rounded-2xl pl-5 pr-16 py-4 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:bg-white focus:border-[#E53935] transition-all shadow-subtle"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 bg-[#E53935] hover:bg-[#D32F2F] text-white p-2.5 rounded-xl text-sm font-semibold disabled:opacity-30 transition-all shadow-sm"
        >
          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
          </svg>
        </button>
      </form>
    </div>
  );
}
