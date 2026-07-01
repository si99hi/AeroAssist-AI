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
    <div className="flex flex-col h-full justify-between flex-1 max-w-2xl mx-auto w-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-8 mb-8 min-h-[450px] pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="serif-heading text-4xl font-normal text-[#111111] mb-4">
              How can we assist you today?
            </div>
            <p className="text-sm text-[#666666] font-serif italic max-w-sm mb-12">
              Access Air India operational intelligence and policy documentation.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSend(q)}
                  disabled={loading}
                  className="text-xs px-4 py-3 border border-[#EFEFEF] bg-white text-[#666666] hover:text-[#B22222] hover:border-[#B22222] transition-colors font-sans"
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
                className={`max-w-[90%] p-6 bg-white border border-[#EFEFEF] text-sm leading-relaxed text-[#111111] ${
                  isUser ? "border-[#B22222]/30 bg-[#FAFAFA]" : ""
                }`}
                style={{ borderRadius: "0px" }}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#EFEFEF] flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-[#999999] mr-1">Systems:</span>
                    {msg.tools.map((tool) => (
                      <span key={tool} className="text-[9px] uppercase tracking-widest text-[#B22222] font-semibold border-b border-[#B22222]/20 pb-0.5">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#EFEFEF]">
                    <div className="text-[9px] uppercase tracking-widest font-semibold text-[#999999] mb-2">Sources & References:</div>
                    <div className="space-y-1">
                      {msg.citations.map((c, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-2 text-[#666666] font-serif italic">
                          <span className="w-1 h-1 bg-[#B22222]"></span>
                          <span>{c.document} {c.page ? `(page ${c.page})` : ""}</span>
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
          <div className="flex items-center gap-2.5 text-xs font-serif italic text-[#999999] pl-1 animate-pulse">
            <span>Querying active logs and documents...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query flights, weather, or Air India policy..."
          className="w-full bg-white border border-[#EFEFEF] rounded-full pl-6 pr-16 py-4 text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#B22222] transition-colors font-sans shadow-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2.5 bg-[#111111] hover:bg-[#B22222] text-white p-2.5 rounded-full transition-colors disabled:opacity-20"
        >
          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
          </svg>
        </button>
      </form>
    </div>
  );
}
