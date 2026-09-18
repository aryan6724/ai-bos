import { useEffect, useState } from "react";
import {
  getDocuments,
  deleteDocument,
  searchDocuments,
} from "../../services/documentService";
import toast from "react-hot-toast";
import {
  FileText,
  Trash2,
  Loader2,
  File,
  FileArchive,
} from "lucide-react";

export default function DocumentList({ refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const res = await getDocuments();

      setDocuments(res.documents || []);
    } catch (error) {
      console.error("Fetch Documents Error:", error);
      toast.error(
  error?.response?.data?.message ||
    "Unable to fetch documents."
);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  const handleDelete = async (id) => {
  if (!window.confirm("Delete this document?")) return;

  try {
    setDeletingId(id);

    await deleteDocument(id);

    toast.success("Document deleted successfully.");

    fetchDocuments();
  } catch (error) {
    console.error("Fetch Documents Error:", error);

    toast.error(
      error?.response?.data?.message ||
        "Unable to delete document."
    );
  } finally {
    setDeletingId(null);
  }
};

useEffect(() => {
  const timer = setTimeout(async () => {
    try {
      if (!search.trim()) {
        await fetchDocuments();
        return;
      }

      const res = await searchDocuments(search);

      setDocuments(res.results || []);
    } catch (error) {
  console.error("Search Error:", error);

  toast.error(
    error?.response?.data?.message ||
      "Search failed."
  );
}
  }, 500);

  return () => clearTimeout(timer);
}, [search]);

const getFileIcon = (mimeType = "") => {
  mimeType = mimeType.toLowerCase();

  if (mimeType.includes("pdf")) {
    return (
      <FileText className="h-8 w-8 text-red-400" />
    );
  }

  if (
    mimeType.includes("word") ||
    mimeType.includes("doc")
  ) {
    return (
      <File className="h-8 w-8 text-blue-400" />
    );
  }

  return (
    <FileArchive className="h-8 w-8 text-slate-400" />
  );
};

if (loading) {
  return (
    <div className="mt-10 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );
}

return (
  <div className="mt-10">
    {/* Search Box */}
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      />
    </div>

    {documents.length === 0 ? (
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-8 text-center">
        <FileText
          className="mx-auto mb-4 text-slate-500"
          size={50}
        />

        <h3 className="text-lg font-semibold text-white">
          No Documents Uploaded
        </h3>

        <p className="mt-2 text-slate-400">
          Upload your first document to begin.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="flex items-center justify-between rounded-2xl border border-slate-700 bg-[#111827] p-5"
          >
            <div className="flex items-center gap-4">
              {getFileIcon(doc.mimeType)}

              <div>
                <h3 className="font-semibold text-white">
                  {doc.originalName}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {doc.size
                    ? `${(doc.size / 1024 / 1024).toFixed(2)} MB`
                    : "-"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {doc.createdAt
                    ? new Date(
                        doc.createdAt
                      ).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  doc.status === "ready"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {doc.status}
              </span>

              <button
                onClick={() =>
                  handleDelete(doc._id)
                }
                disabled={
                  deletingId === doc._id
                }
                className="rounded-lg bg-red-500/20 p-2 text-red-400 transition hover:bg-red-500/30"
              >
                {deletingId === doc._id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}