import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const chatApi = {
  list: () => api.get("/chat").then((r) => r.data),
  get: (id: number) => api.get(`/chat/${id}`).then((r) => r.data),
  send: (question: string, chatId?: number) =>
    api.post("/chat", { question, chat_id: chatId }).then((r) => r.data),
  publicSend: (question: string) =>
    api.post("/chat/public", { question }).then((r) => r.data),
};

export const documentsApi = {
  list: () => api.get("/documents").then((r) => r.data),
  upload: (file: File, airline = "United", category = "General") => {
    const form = new FormData();
    form.append("file", file);
    form.append("airline", airline);
    form.append("category", category);
    return api.post("/documents/upload", form).then((r) => r.data);
  },
  delete: (id: number) => api.delete(`/documents/${id}`).then((r) => r.data),
  rebuild: (airline = "United") =>
    api.post(`/documents/rebuild?airline=${airline}`).then((r) => r.data),
};

export const analyticsApi = {
  get: () => api.get("/analytics").then((r) => r.data),
};

export default api;
