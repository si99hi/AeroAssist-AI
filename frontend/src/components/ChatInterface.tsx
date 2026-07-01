import { useState } from "react";
import type { ChatResponse } from "../types";

const SUGGESTIONS = [
  "Why is UA451 delayed?",
  "Can I carry two bags?",
  "What is the weather at SFO?",
  "Can I rebook after cancellation on UA100?",
];

interface Props {
  onSend: (question: string) => Promise<ChatResponse>;
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
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSend(q)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-gray-400 hover:text-white hover:border-accent transition"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border border-border rounded-xl p-4 bg-panel space-y-3 min-h-[400px]">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm">Ask about flights, weather, or airline policy.</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user" ? "ml-auto bg-gray-800" : "bg-[#12213a]"
            }`}
          >
            {msg.content}
            {msg.tools && msg.tools.length > 0 && (
              <span className="block mt-2 text-xs text-gray-500">
                tools: {msg.tools.join(", ")}
              </span>
            )}
            {msg.citations && msg.citations.length > 0 && (
              <span className="block mt-1 text-xs text-blue-400">
                citations: {msg.citations.map((c) => c.document).join(", ")}
              </span>
            )}
          </div>
        ))}
        {loading && <p className="text-gray-500 text-sm">Thinking...</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-panel border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent px-5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
