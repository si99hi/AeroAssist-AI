export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Message {
  id: number;
  role: string;
  content: string;
}

export interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

export interface ChatResponse {
  answer: string;
  tools_used: string[];
  citations: Record<string, string | number>[];
  chat_id: number;
}

export interface Analytics {
  tool_usage: Record<string, number>;
  avg_latency_ms: number;
  total_tool_calls: number;
}

export interface DocumentItem {
  id: number;
  airline: string;
  filename: string;
  category: string;
  embedding_status: string;
}
