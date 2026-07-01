import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { documentsApi } from "../services/api";
import type { DocumentItem } from "../types";

export default function Admin() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = () => documentsApi.list().then(setDocs);

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("Uploading document...");
    try {
      await documentsApi.upload(file);
      setStatus("Document uploaded and indexed successfully.");
      refresh();
    } catch {
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await documentsApi.delete(id);
    refresh();
  };

  const handleRebuild = async () => {
    setStatus("Rebuilding index...");
    await documentsApi.rebuild();
    setStatus("Index rebuilt successfully.");
    refresh();
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10 pb-5 border-b border-[#F1F1F1]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Document Management</h1>
          <p className="text-xs text-[#666666] mt-1">Manage corporate policy files and build RAG knowledge indexes</p>
        </div>
        <Link to="/dashboard" className="text-sm font-semibold text-[#E53935] hover:text-[#D32F2F] transition-colors">
          Back to chat
        </Link>
      </header>

      {/* Control Card */}
      <div className="border border-[#F1F1F1] rounded-3xl p-8 bg-[#FAFAFA] mb-10 shadow-soft">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#666666] mb-4">Ingest New Policy Document</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="relative flex items-center justify-center border-2 border-dashed border-[#E5E5E5] hover:border-[#E53935] bg-white px-4 py-8 rounded-2xl cursor-pointer transition-colors group">
              <span className="text-sm font-semibold text-[#666666] group-hover:text-[#E53935] transition-colors">
                {uploading ? "Uploading & Indexing..." : "Choose document file (PDF, TXT, MD)"}
              </span>
              <input type="file" accept=".pdf,.txt,.md,.docx" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          
          <button
            onClick={handleRebuild}
            className="bg-white hover:bg-[#FAFAFA] text-[#111111] border border-[#F1F1F1] px-6 py-4 rounded-2xl text-sm font-semibold shadow-subtle hover:shadow-soft transition-all"
          >
            Rebuild vector index
          </button>
        </div>
        
        {status && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#666666] bg-white border border-[#F1F1F1] px-3.5 py-2.5 rounded-xl max-w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] animate-pulse"></span>
            {status}
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#666666] mb-4 pl-1">Indexed Knowledge Files</h2>
        <div className="border border-[#F1F1F1] rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] border-b border-[#F1F1F1] text-xs font-bold uppercase tracking-wider text-[#666666]">
              <tr>
                <th className="text-left p-4 pl-6">Filename</th>
                <th className="text-left p-4">Airline</th>
                <th className="text-left p-4">Indexing status</th>
                <th className="p-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1]">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="p-4 pl-6 font-medium text-[#111111] max-w-xs truncate">{d.filename}</td>
                  <td className="p-4">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                      d.airline.toLowerCase() === "air india"
                        ? "bg-[#E53935]/5 text-[#E53935] border border-[#E53935]/10"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}>
                      {d.airline}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        d.embedding_status === "ready" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      }`}></span>
                      <span className="text-xs text-[#666666] font-medium">{d.embedding_status}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-xs font-semibold text-[#E53935] hover:text-[#D32F2F] transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-xs text-[#999999] italic">
                    No documents uploaded yet. Local policy PDFs are auto-synced during backend startup.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
