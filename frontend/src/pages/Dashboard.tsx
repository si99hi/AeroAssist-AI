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
    <div className="min-h-screen flex bg-white text-[#111111] antialiased font-sans">
      {/* Editorial Sidebar */}
      <aside className="w-[240px] max-w-[240px] border-r border-[#EFEFEF] p-6 hidden md:flex flex-col bg-white justify-between">
        <div>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666666]">
              AeroAssist
            </h2>
            <button
              onClick={() => {
                setActiveChatId(undefined);
                setMessages([]);
              }}
              title="New Session"
              className="text-[#666666] hover:text-[#B22222] transition-colors p-1 border border-[#EFEFEF] rounded-md text-xs font-semibold"
            >
              +
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-[10px] font-semibold text-[#999999] uppercase tracking-widest mb-4 pl-1">
              Sessions
            </h3>
            <div className="space-y-1.5 overflow-y-auto max-h-[60vh] pr-1">
              {chats.length === 0 ? (
                <p className="text-xs text-[#999999] italic pl-1">None active</p>
              ) : (
                chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadChat(c.id)}
                    className={`w-full text-left text-xs px-2.5 py-2 truncate font-normal transition-all ${
                      activeChatId === c.id
                        ? "text-[#111111] border-l-2 border-[#B22222] font-semibold bg-[#FAFAFA]"
                        : "text-[#666666] hover:text-[#111111] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-[#EFEFEF] pt-4">
          <div className="flex items-center gap-2.5 mb-3 pl-1">
            <div className="w-6 h-6 bg-[#EFEFEF] flex items-center justify-center text-[#111111] text-[10px] font-semibold">
              {user ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="truncate">
              <p className="text-[11px] font-semibold text-[#111111] truncate">
                {user ? user.name : "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-[10px] font-semibold uppercase tracking-widest text-[#666666] hover:text-[#B22222] px-1 py-1 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Editorial Main Area */}
      <main className="flex-1 flex flex-col min-h-screen bg-white">
        <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-[#EFEFEF]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B22222]"></span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#666666]">
              Ops Terminal
            </span>
          </div>
          <nav className="flex items-center gap-8 text-[11px] font-semibold uppercase tracking-widest">
            <Link to="/admin" className="text-[#666666] hover:text-[#B22222] transition-colors">
              Admin
            </Link>
            <Link to="/analytics" className="text-[#666666] hover:text-[#B22222] transition-colors">
              Analytics
            </Link>
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-10 max-w-3xl mx-auto w-full flex flex-col justify-between">
          <ChatInterface onSend={handleSend} messages={messages} loading={loading} />
        </div>
      </main>
    </div>
  );
}
