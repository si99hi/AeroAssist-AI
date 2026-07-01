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
    setStatus("Uploading...");
    try {
      await documentsApi.upload(file);
      setStatus("Uploaded and indexed.");
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
    setStatus("Index rebuilt.");
    refresh();
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Admin — Documents</h1>
        <Link to="/dashboard" className="text-sm text-accent">
          Back to chat
        </Link>
      </header>

      <div className="border border-border rounded-xl p-6 bg-panel mb-6">
        <label className="block text-sm text-gray-400 mb-2">Upload policy document (PDF, TXT, MD)</label>
        <input type="file" accept=".pdf,.txt,.md,.docx" onChange={handleUpload} disabled={uploading} />
        <button
          onClick={handleRebuild}
          className="mt-4 block bg-accent px-4 py-2 rounded-lg text-sm"
        >
          Rebuild vector index
        </button>
        {status && <p className="text-sm text-gray-400 mt-2">{status}</p>}
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-3">File</th>
              <th className="text-left p-3">Airline</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">{d.filename}</td>
                <td className="p-3">{d.airline}</td>
                <td className="p-3">{d.embedding_status}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No documents uploaded yet. Sample policies are loaded from /documents.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
