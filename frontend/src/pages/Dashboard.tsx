import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChatInterface from "../components/ChatInterface";
import { authApi, chatApi } from "../services/api";
import type { Chat, ChatResponse, User } from "../types";

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
      chat.messages.map((m) => ({
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
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border p-4 hidden md:block">
        <h2 className="font-semibold mb-4">Chats</h2>
        <button
          onClick={() => {
            setActiveChatId(undefined);
            setMessages([]);
          }}
          className="w-full text-left text-sm mb-3 text-accent"
        >
          + New chat
        </button>
        <div className="space-y-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => loadChat(c.id)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded truncate ${
                activeChatId === c.id ? "bg-gray-800" : "hover:bg-gray-800/50"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">AeroAssist AI</h1>
            <p className="text-gray-400 text-sm">
              {user ? `Welcome, ${user.name}` : "Loading..."}
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/admin" className="text-gray-400 hover:text-white">
              Admin
            </Link>
            <Link to="/analytics" className="text-gray-400 hover:text-white">
              Analytics
            </Link>
            <button onClick={logout} className="text-gray-400 hover:text-white">
              Logout
            </button>
          </nav>
        </header>

        <ChatInterface onSend={handleSend} messages={messages} loading={loading} />
      </main>
    </div>
  );
}
