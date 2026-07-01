import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChatInterface from "../components/ChatInterface";
import { authApi, chatApi } from "../services/api";
import type { Chat, ChatResponse, User, Message } from "../types";

type DisplayMessage = {
  role: string;
  content: string;
  tools?: string[];
  citations?: Record<string, string | number>[];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | undefined>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.me().then(setUser).catch(() => navigate("/login"));
    chatApi.list().then(setChats).catch(() => {});
  }, [navigate]);

  const handleSend = async (question: string) => {
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response: ChatResponse = await chatApi.send(question, activeChatId);
      setActiveChatId(response.chat_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          tools: response.tools_used,
          citations: response.citations,
        },
      ]);
      const updated = await chatApi.list();
      setChats(updated);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (chatId: number) => {
    const chat = await chatApi.get(chatId);
    setActiveChatId(chatId);
    setMessages(
      chat.messages.map((m: Message) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }))
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-white text-[#111111] antialiased">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#F1F1F1] p-6 hidden md:flex flex-col bg-[#FAFAFA] justify-between">
        <div>
          <div className="mb-8">
            <h2 className="text-xs font-bold tracking-wider text-[#666666] uppercase mb-4">Operations Console</h2>
            <button
              onClick={() => {
                setActiveChatId(undefined);
                setMessages([]);
              }}
              className="w-full bg-[#E53935] hover:bg-[#D32F2F] text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>+</span> New Session
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-3 pl-2">Session History</h3>
            <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-2">
              {chats.length === 0 ? (
                <p className="text-xs text-[#999999] italic pl-2 py-2">No active sessions</p>
              ) : (
                chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadChat(c.id)}
                    className={`w-full text-left text-sm px-3.5 py-2.5 rounded-xl truncate font-medium transition-all ${
                      activeChatId === c.id
                        ? "bg-white border border-[#F1F1F1] text-[#111111] shadow-soft"
                        : "text-[#666666] hover:bg-white hover:text-[#111111] hover:shadow-subtle"
                    }`}
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Card in Sidebar */}
        <div className="border-t border-[#F1F1F1] pt-4">
          <div className="flex items-center gap-3 mb-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-[#E53935]/10 flex items-center justify-center text-[#E53935] font-bold text-sm">
              {user ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-[#111111] truncate">{user ? user.name : "Loading..."}</p>
              <p className="text-xs text-[#666666] truncate">{user ? user.email : ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs font-semibold text-[#666666] hover:text-[#E53935] px-2 py-1.5 transition-colors"
          >
            Logout from system
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-h-screen bg-white">
        <header className="border-b border-[#F1F1F1] px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-pulse"></div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#111111]">AeroAssist AI</h1>
              <p className="text-xs text-[#666666]">Air India Flight Ops & Policy Intelligence</p>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/admin" className="text-[#666666] hover:text-[#E53935] transition-colors">
              Admin Panel
            </Link>
            <Link to="/analytics" className="text-[#666666] hover:text-[#E53935] transition-colors">
              Performance Analytics
            </Link>
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-8 max-w-4xl mx-auto w-full flex flex-col justify-between">
          <ChatInterface onSend={handleSend} messages={messages} loading={loading} />
        </div>
      </main>
    </div>
  );
}
