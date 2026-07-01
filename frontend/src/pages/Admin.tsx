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
    <div className="min-h-screen bg-white text-[#111111] antialiased p-8 max-w-4xl mx-auto font-sans">
      <header className="flex items-center justify-between mb-10 pb-5 border-b border-[#EFEFEF]">
        <div>
          <h1 className="serif-heading text-4xl font-normal tracking-tight text-[#111111]">Document Ingestion</h1>
          <p className="text-xs font-serif italic text-[#666666] mt-1">Manage corporate policy files and build RAG knowledge indexes</p>
        </div>
        <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-widest text-[#B22222] hover:underline transition-colors">
          Back to chat
        </Link>
      </header>

      {/* Control Card */}
      <div className="border border-[#EFEFEF] p-8 bg-white mb-10" style={{ borderRadius: "0px" }}>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666666] mb-4">Ingest New Policy Document</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="relative flex items-center justify-center border border-dashed border-[#DCDCDC] hover:border-[#B22222] bg-white px-4 py-8 cursor-pointer transition-colors group">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] group-hover:text-[#B22222] transition-colors font-sans">
                {uploading ? "Uploading & Indexing..." : "Choose document file (PDF, TXT, MD)"}
              </span>
              <input type="file" accept=".pdf,.txt,.md,.docx" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          
          <button
            onClick={handleRebuild}
            className="bg-white hover:bg-[#FAFAFA] text-[#111111] border border-[#EFEFEF] px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all"
          >
            Rebuild vector index
          </button>
        </div>
        
        {status && (
          <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#666666] border-t border-[#EFEFEF] pt-4 max-w-fit font-sans">
            <span className="w-1.5 h-1.5 bg-[#B22222]"></span>
            {status}
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666666] mb-4 pl-1">Indexed Knowledge Files</h2>
        <div className="border border-[#EFEFEF] overflow-hidden" style={{ borderRadius: "0px" }}>
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] border-b border-[#EFEFEF] text-[10px] font-semibold uppercase tracking-widest text-[#666666]">
              <tr>
                <th className="text-left p-4 pl-6">Filename</th>
                <th className="text-left p-4">Airline</th>
                <th className="text-left p-4">Indexing status</th>
                <th className="p-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEF] text-xs">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="p-4 pl-6 font-medium text-[#111111] max-w-xs truncate">{d.filename}</td>
                  <td className="p-4">
                    <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      d.airline.toLowerCase() === "air india"
                        ? "text-[#B22222] border border-[#B22222]/25 bg-[#B22222]/5"
                        : "text-gray-600 border border-gray-200"
                    }`}>
                      {d.airline}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${
                        d.embedding_status === "ready" ? "bg-emerald-600" : "bg-amber-600 animate-pulse"
                      }`}></span>
                      <span className="text-xs text-[#666666] font-medium">{d.embedding_status}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-[10px] font-semibold uppercase tracking-widest text-[#B22222] hover:underline transition-colors"
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
