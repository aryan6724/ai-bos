import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  File,
  FileText,
  Image,
  Info,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
  deleteDocument,
  getDocuments,
  getDocumentDetails,
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

const statusOptions = ["all", "ready", "processing", "failed", "uploaded"];

const formatFileSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString(undefined, {
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

const getStatusClasses = (status) => {
  switch (status) {
    case "ready":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "processing":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "failed":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "ready":
      return "Ready";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return "Uploaded";
  }
};

export default function DocumentsPage() {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoadingDocuments(true);
      } else {
        setIsRefreshing(true);
      }

      const data = await getDocuments();
      setDocuments(data.documents || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setIsLoadingDocuments(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const hasProcessingDocuments = useMemo(
    () => documents.some((document) => document.status === "processing"),
    [documents]
  );

  // Poll only while at least one document is processing.
  // This lets Processing -> Ready update automatically without a manual refresh.
  useEffect(() => {
    if (!hasProcessingDocuments) return undefined;

    const intervalId = window.setInterval(() => {
      loadDocuments(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [hasProcessingDocuments, loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !normalizedSearch ||
        document.originalName?.toLowerCase().includes(normalizedSearch) ||
        document.documentType?.toLowerCase().includes(normalizedSearch) ||
        document.category?.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" ||
        document.category?.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || document.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const ready = documents.filter(
      (document) => document.status === "ready"
    ).length;
    const processing = documents.filter(
      (document) => document.status === "processing"
    ).length;
    const failed = documents.filter(
      (document) => document.status === "failed"
    ).length;

    return {
      total: documents.length,
      ready,
      processing,
      failed,
    };
  }, [documents]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

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

      setSuccessMessage(
        "Document uploaded successfully. Processing will update automatically."
      );
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDocuments(false);
    } catch (err) {
      setError(err.response?.data?.message || "Document upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDetails = async (document) => {
    setSelectedDocument(document);
    setDocumentDetails(null);
    setDetailsError("");
    setTextSearchQuery("");
    setCopiedText(false);
    setIsLoadingDetails(true);

    try {
      const data = await getDocumentDetails(document._id);
      setDocumentDetails(data.document || null);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          "Failed to load document details."
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCopyExtractedText = async () => {
    const text = documentDetails?.text || "";

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);

      window.setTimeout(() => {
        setCopiedText(false);
      }, 1800);
    } catch {
      setDetailsError(
        "Unable to copy the extracted text. Please copy it manually."
      );
    }
  };

  const handleDelete = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(documentId);
      setError("");
      setSuccessMessage("");

      await deleteDocument(documentId);

      if (selectedDocument?._id === documentId) {
        setSelectedDocument(null);
        setDocumentDetails(null);
        setTextSearchQuery("");
        setCopiedText(false);
      }

      setSuccessMessage("Document deleted successfully.");
      await loadDocuments(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageHeader
        badge="Document Vault"
        title="Documents"
        description="Upload, manage, chat with, and analyze business documents using AI-powered document intelligence."
      />

      {/* Vault overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Files</span>
            <FileText size={19} className="text-cyan-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.total}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Ready</span>
            <CheckCircle2 size={19} className="text-emerald-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.ready}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Processing</span>
            <Clock3 size={19} className="text-amber-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.processing}
          </p>
        </div>

        <div className="rounded-3xl border border-rose-400/10 bg-rose-400/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Failed</span>
            <AlertCircle size={19} className="text-rose-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.failed}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {/* Upload */}
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-400">Secure Upload</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Upload Document
            </h2>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>{successMessage}</span>
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
                Choose a document
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Upload PDF, image, text, DOC, or DOCX files. Maximum file size:
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
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Remove selected file"
                >
                  <X size={16} />
                </button>
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
                  Upload Document
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Documents */}
        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Workspace Files</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Uploaded Documents
              </h2>
            </div>

            <button
              type="button"
              onClick={() => loadDocuments(false)}
              disabled={isRefreshing}
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200">
              {documents.length} total
            </span>

            {hasProcessingDocuments && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
                <Loader2 size={13} className="animate-spin" />
                Auto-refreshing
              </span>
            )}
          </div>

          {!isLoadingDocuments && documents.length > 0 && (
            <div className="mb-5 space-y-3">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by document name, type or category..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-10 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                >
                  <option value="all" className="bg-slate-950">
                    All Categories
                  </option>
                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-slate-950"
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                >
                  {statusOptions.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-slate-950"
                    >
                      {item === "all" ? "All Statuses" : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>
                  Showing {filteredDocuments.length} of {documents.length}{" "}
                  documents
                </span>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoadingDocuments ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="animate-spin text-cyan-300" size={34} />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <FileText className="text-slate-500" size={42} />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No documents uploaded yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Upload your first file to start building the document layer
                for AI-BOS.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Search className="text-slate-500" size={38} />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No matching documents
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Try a different search term or change the category and status
                filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => {
                const Icon = getFileIcon(document.mimeType);
                const isReady = document.status === "ready";
                const isAnalyzed = Boolean(
                  document.summary ||
                    document.keywords?.length ||
                    document.documentType
                );

                return (
                  <div
                    key={document._id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex min-w-0 items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                            <Icon size={22} />
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate font-medium text-white"
                              title={document.originalName}
                            >
                              {document.originalName}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              <span className="capitalize">
                                {document.category || "general"}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(document.size)}</span>

                              {document.pages ? (
                                <>
                                  <span>•</span>
                                  <span>{document.pages} pages</span>
                                </>
                              ) : null}

                              {document.wordCount ? (
                                <>
                                  <span>•</span>
                                  <span>
                                    {document.wordCount.toLocaleString()} words
                                  </span>
                                </>
                              ) : null}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                                  document.status
                                )}`}
                              >
                                {getStatusLabel(document.status)}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                  isAnalyzed
                                    ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                                    : "border-slate-400/20 bg-slate-400/10 text-slate-400"
                                }`}
                              >
                                {isAnalyzed
                                  ? "AI Analysis Available"
                                  : "Not Analyzed"}
                              </span>

                              {document.documentType && (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400">
                                  {document.documentType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewDetails(document)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-200"
                          title="View document details"
                          aria-label={`View details for ${document.originalName}`}
                        >
                          <Info size={17} />
                        </button>
                      </div>

                      {document.status === "processing" && (
                        <div className="flex items-center gap-2 rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2 text-xs text-amber-300">
                          <Loader2 size={14} className="animate-spin" />
                          <span>
                            AI-BOS is processing this document. Actions will
                            become available when it is ready.
                          </span>
                        </div>
                      )}

                      {document.status === "failed" && (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-400/10 bg-rose-400/[0.04] px-3 py-2 text-xs text-rose-300">
                          <AlertCircle size={14} />
                          <span>
                            Document processing failed. Please check the file
                            or upload it again.
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/document-chat?documentId=${document._id}`}
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition ${
                            isReady
                              ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                              : "pointer-events-none border-white/5 bg-white/[0.03] text-slate-600"
                          }`}
                          title={
                            isReady
                              ? "Chat with document"
                              : "Document must be ready before chat"
                          }
                          aria-disabled={!isReady}
                        >
                          <MessageSquareText size={17} />
                          Chat
                        </Link>

                        <Link
                          to={`/dashboard/ai-tools/document-analyzer?documentId=${document._id}`}
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition ${
                            isReady
                              ? "border-violet-400/20 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20"
                              : "pointer-events-none border-white/5 bg-white/[0.03] text-slate-600"
                          }`}
                          title={
                            isReady
                              ? "Analyze document"
                              : "Document must be ready before analysis"
                          }
                          aria-disabled={!isReady}
                        >
                          <FileText size={17} />
                          Analyze
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(document._id)}
                          disabled={deletingId === document._id}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm font-medium text-rose-300 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Delete document"
                        >
                          {deletingId === document._id ? (
                            <Loader2 className="animate-spin" size={17} />
                          ) : (
                            <Trash2 size={17} />
                          )}
                          Delete
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

      {/* Document details modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDocument(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {(() => {
                  const Icon = getFileIcon(selectedDocument.mimeType);
                  return (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                      <Icon size={22} />
                    </div>
                  );
                })()}

                <div className="min-w-0">
                  <h3
                    id="document-details-title"
                    className="break-words text-xl font-semibold text-white"
                  >
                    {selectedDocument.originalName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Document details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDocument(null);
                  setDocumentDetails(null);
                  setTextSearchQuery("");
                  setCopiedText(false);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close document details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Category</p>
                <p className="mt-1 capitalize text-sm font-medium text-white">
                  {selectedDocument.category || "general"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {getStatusLabel(selectedDocument.status)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">File Size</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {formatFileSize(selectedDocument.size)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">File Type</p>
                <p className="mt-1 break-all text-sm font-medium text-white">
                  {selectedDocument.mimeType || "Unknown"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Pages</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedDocument.pages || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Words</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedDocument.wordCount
                    ? selectedDocument.wordCount.toLocaleString()
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Document Type</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedDocument.documentType || "General"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Uploaded</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {formatDate(selectedDocument.createdAt)}
                </p>
              </div>
            </div>

            {isLoadingDetails ? (
              <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={18} className="animate-spin text-cyan-300" />
                  Loading document details and extracted text...
                </div>
              </div>
            ) : detailsError ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
                {detailsError}
              </div>
            ) : documentDetails ? (
              <>
                {documentDetails.summary && (
                  <div className="mt-4 rounded-2xl border border-violet-400/10 bg-violet-400/[0.04] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
                      AI Summary
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {documentDetails.summary}
                    </p>
                  </div>
                )}

                {documentDetails.keywords?.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Keywords
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {documentDetails.keywords.map((keyword, index) => (
                        <span
                          key={`${keyword}-${index}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Extracted Text
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {documentDetails.wordCount
                          ? `${documentDetails.wordCount.toLocaleString()} words`
                          : "Text extracted from uploaded document"}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <input
                        type="text"
                        value={textSearchQuery}
                        onChange={(event) =>
                          setTextSearchQuery(event.target.value)
                        }
                        placeholder="Search inside text..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40 sm:w-52"
                      />

                      <button
                        type="button"
                        onClick={handleCopyExtractedText}
                        disabled={!documentDetails.text}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copiedText ? "Copied" : "Copy Text"}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const text = documentDetails.text || "";
                    const query = textSearchQuery.trim();

                    if (!text) {
                      return (
                        <div className="mt-4 rounded-xl border border-white/5 bg-black/10 p-4 text-sm text-slate-500">
                          No extracted text is available for this document.
                        </div>
                      );
                    }

                    if (!query) {
                      return (
                        <pre className="mt-4 max-h-[380px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/10 p-4 font-sans text-sm leading-6 text-slate-300">
                          {text}
                        </pre>
                      );
                    }

                    const lowerText = text.toLowerCase();
                    const lowerQuery = query.toLowerCase();
                    const matchIndex = lowerText.indexOf(lowerQuery);

                    if (matchIndex === -1) {
                      return (
                        <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-sm text-amber-300">
                          No matching text found for "{query}".
                        </div>
                      );
                    }

                    const startIndex = Math.max(0, matchIndex - 1200);
                    const endIndex = Math.min(
                      text.length,
                      matchIndex + query.length + 2200
                    );

                    return (
                      <div className="mt-4 max-h-[380px] overflow-auto rounded-xl border border-white/5 bg-black/10 p-4">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                          {text.slice(startIndex, endIndex)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {selectedDocument.status === "ready" && (
                <>
                  <Link
                    to={`/dashboard/document-chat?documentId=${selectedDocument._id}`}
                    onClick={() => setSelectedDocument(null)}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    <MessageSquareText size={17} />
                    Open Chat
                  </Link>

                  <Link
                    to={`/dashboard/ai-tools/document-analyzer?documentId=${selectedDocument._id}`}
                    onClick={() => setSelectedDocument(null)}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 text-sm font-medium text-violet-300 transition hover:bg-violet-400/20"
                  >
                    <FileText size={17} />
                    Open Analyzer
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedDocument(null);
                  setDocumentDetails(null);
                  setTextSearchQuery("");
                  setCopiedText(false);
                }}
                className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
