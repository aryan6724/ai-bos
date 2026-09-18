import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  File,
  FileText,
  HardDrive,
  Image,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../services/documentService";

const categories = [
  "general",
  "policy",
  "invoice",
  "resume",
  "report",
  "contract",
];

const formatFileSize = (size) => {
  if (!size) return "0 KB";

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Recently";

  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFileIcon = (mimeType) => {
  if (mimeType?.includes("pdf")) return FileText;
  if (mimeType?.includes("image")) return Image;
  return File;
};

export default function UploadsPage() {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const totalStorage = documents.reduce((total, item) => {
    return total + (item.size || 0);
  }, 0);

  const storageLimit = 250 * 1024 * 1024;
  const storagePercentage = Math.min(
    Math.round((totalStorage / storageLimit) * 100),
    100
  );

  const pdfCount = documents.filter((item) =>
    item.mimeType?.includes("pdf")
  ).length;

  const imageCount = documents.filter((item) =>
    item.mimeType?.includes("image")
  ).length;

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load uploads.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccessMessage("");
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setSuccessMessage("");

      await uploadDocument({
        file: selectedFile,
        category,
      });

      setSuccessMessage("File uploaded successfully.");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this uploaded file?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(documentId);
      setError("");
      setSuccessMessage("");

      await deleteDocument(documentId);

      setSuccessMessage("File deleted successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete file.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <DashboardPageHeader
          badge="Upload Center"
          title="Uploads"
          description="Manage file uploads, storage usage, document categories, and prepare files for AI-powered document intelligence."
        />

        <button
          type="button"
          onClick={loadDocuments}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Total Files</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {documents.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <FileText size={23} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Storage Used</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {formatFileSize(totalStorage)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <HardDrive size={23} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">PDF Files</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {pdfCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
              <FileText size={23} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Images</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {imageCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Image size={23} />
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-400">Upload New File</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              File Uploader
            </h2>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Category
              </span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
              >
                {categories.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-6 text-center transition hover:border-cyan-300/60 hover:bg-cyan-400/10">
              <UploadCloud className="text-cyan-300" size={42} />

              <p className="mt-4 text-base font-semibold text-white">
                Drop or choose a file
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Supported files: PDF, images, TXT, DOC, and DOCX. Maximum size:
                10MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"
              />
            </label>

            {selectedFile && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-medium text-white">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={19} />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={19} />
                  Upload File
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Storage Usage</p>
              <p className="text-sm text-slate-400">{storagePercentage}%</p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/20"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {formatFileSize(totalStorage)} used of 250 MB workspace storage.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Upload History</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Uploaded Files
              </h2>
            </div>

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              {documents.length} files
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="animate-spin text-cyan-300" size={36} />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <UploadCloud className="text-slate-500" size={44} />

              <h3 className="mt-4 text-lg font-semibold text-white">
                No uploaded files yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Upload your first document to start using AI-BOS document
                intelligence.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => {
                const Icon = getFileIcon(document.mimeType);

                return (
                  <div
                    key={document._id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                          <Icon size={22} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {document.originalName}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="capitalize">
                              {document.category}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(document.size)}</span>
                            <span>•</span>
                            <span>{formatDate(document.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {document.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/dashboard/document-chat?documentId=${document._id}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                          title="Chat with document"
                        >
                          <MessageSquareText size={18} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(document._id)}
                          disabled={deletingId === document._id}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-60"
                          title="Delete file"
                        >
                          {deletingId === document._id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}