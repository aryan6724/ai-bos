import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clipboard,
  Download,
  FileSearch,
  FileText,
  Hash,
  KeyRound,
  Loader2,
  Search,
  Sparkles,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  analyzeDocument,
  getAnalysisHistory,
  getAnalysisHistoryById,
  deleteAnalysisHistory,
} from "../services/aiService";

import jsPDF from "jspdf";

import {
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import { getDocuments } from "../services/documentService";
import AnalysisHistoryPanel from "../components/AnalysisHistoryPanel";

export default function DocumentAnalyzerPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] =
    useState("");

  const [search, setSearch] = useState("");
  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [analysisHistory, setAnalysisHistory] =
    useState([]);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [selectedHistoryId, setSelectedHistoryId] =
    useState("");

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(10);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  /* =========================================================
     LOAD DOCUMENTS
  ========================================================= */

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError("");

      const response = await getDocuments();

      const list =
        response?.documents ||
        response?.data ||
        response?.result ||
        [];

      const normalizedList = Array.isArray(list)
        ? list
        : [];

      setDocuments(normalizedList);

      if (normalizedList.length > 0) {
        const firstReadyDocument =
          normalizedList.find(
            (document) =>
              document.status === "ready"
          );

        if (firstReadyDocument) {
          setSelectedDocumentId(
            firstReadyDocument._id
          );
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  /* =========================================================
     LOAD ANALYSIS HISTORY
  ========================================================= */

  const loadAnalysisHistory = async (
    documentId = selectedDocumentId,
    page = historyPage
  ) => {
    if (!documentId) {
      setAnalysisHistory([]);
      setHistoryPagination({
        page: 1,
        pageSize: historyPageSize,
        total: 0,
        totalPages: 0,
      });
      return;
    }

    try {
      setLoadingHistory(true);

      const response = await getAnalysisHistory({
        documentId,
        page,
        pageSize: historyPageSize,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to load analysis history."
        );
      }

      setAnalysisHistory(
        Array.isArray(response.history)
          ? response.history
          : []
      );

      setHistoryPagination(
        response.pagination || {
          page,
          pageSize: historyPageSize,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load analysis history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    setHistoryPage(1);

    if (selectedDocumentId) {
      loadAnalysisHistory(selectedDocumentId, 1);
    } else {
      setAnalysisHistory([]);
      setHistoryPagination({
        page: 1,
        pageSize: historyPageSize,
        total: 0,
        totalPages: 0,
      });
    }

    setSelectedHistoryId("");
  }, [selectedDocumentId]);

  /* =========================================================
     FILTER DOCUMENTS
  ========================================================= */

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return documents;
    }

    return documents.filter((document) =>
      (
        document.originalName ||
        document.fileName ||
        ""
      )
        .toLowerCase()
        .includes(query)
    );
  }, [documents, search]);

  /* =========================================================
     SELECTED DOCUMENT
  ========================================================= */

  const selectedDocument = useMemo(() => {
    return documents.find(
      (document) =>
        document._id === selectedDocumentId
    );
  }, [documents, selectedDocumentId]);

  /* =========================================================
     ANALYZE DOCUMENT
  ========================================================= */

  const handleAnalyze = async (
    forceReanalyze = false
  ) => {
    if (!selectedDocumentId) {
      setError("Please select a document first.");
      return;
    }

    if (
      selectedDocument &&
      selectedDocument.status !== "ready"
    ) {
      setError(
        "This document is not ready for analysis yet."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setCopied(false);

      if (forceReanalyze) {
        setAnalysis(null);
      }

      const response = await analyzeDocument(
        selectedDocumentId,
        forceReanalyze
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Document analysis failed."
        );
      }

      setAnalysis(response.result || null);

      setSelectedHistoryId(
        response.result?.historyId || ""
      );

      setHistoryPage(1);

      await loadAnalysisHistory(
        selectedDocumentId,
        1
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to analyze the document."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* =========================================================
     ANALYSIS HISTORY PAGINATION
  ========================================================= */

  const handleHistoryPageChange = async (
    nextPage
  ) => {
    const totalPages =
      historyPagination.totalPages || 0;

    if (
      !selectedDocumentId ||
      loadingHistory ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === historyPage
    ) {
      return;
    }

    setHistoryPage(nextPage);
    await loadAnalysisHistory(
      selectedDocumentId,
      nextPage
    );
  };

  /* =========================================================
     VIEW ANALYSIS HISTORY
  ========================================================= */

  const handleViewHistory = async (
    historyId
  ) => {
    try {
      setError("");
      setSelectedHistoryId(historyId);

      const response =
        await getAnalysisHistoryById(
          historyId
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to load this analysis."
        );
      }

      setAnalysis(
        response.result || null
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load this analysis."
      );
    }
  };

  /* =========================================================
     DELETE ANALYSIS HISTORY
  ========================================================= */

  const handleDeleteHistory = async (
    historyId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this analysis history entry?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteAnalysisHistory(
        historyId
      );

      if (
        selectedHistoryId ===
        historyId
      ) {
        setSelectedHistoryId("");
        setAnalysis(null);
      }

      const totalAfterDelete = Math.max(
        (historyPagination.total || 0) - 1,
        0
      );

      const totalPagesAfterDelete =
        Math.ceil(
          totalAfterDelete /
            historyPageSize
        );

      const nextPage = Math.min(
        historyPage,
        Math.max(totalPagesAfterDelete, 1)
      );

      setHistoryPage(nextPage);

      await loadAnalysisHistory(
        selectedDocumentId,
        nextPage
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete analysis history."
      );
    }
  };

  /* =========================================================
     COPY FULL ANALYSIS
  ========================================================= */

  const handleCopyAnalysis = async () => {
    if (!analysis) {
      return;
    }

    const sections = analysis.sections || {};

    const fullText = `
DOCUMENT
${analysis.documentName || "Untitled Document"}

DOCUMENT TYPE
${analysis.documentType || "General"}

SUMMARY
${sections.summary || "None found."}

KEY POINTS
${sections.keyPoints || "None found."}

KEY INFORMATION
${sections.keyInformation || "None found."}

IMPORTANT DATES
${sections.importantDates || "None found."}

IMPORTANT NUMBERS
${sections.importantNumbers || "None found."}

RISKS AND ISSUES
${sections.risksAndIssues || "None identified."}

ACTION ITEMS
${sections.actionItems || "None identified."}

KEYWORDS
${
  Array.isArray(sections.keywords)
    ? sections.keywords.join(", ")
    : sections.keywords || "None found."
}
`.trim();

    try {
      await navigator.clipboard.writeText(fullText);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Unable to copy the analysis.");
    }
  };

  /* =========================================================
     SAFE FILE NAME
  ========================================================= */

  const getSafeFileName = () => {
    const name =
      analysis?.documentName ||
      "Document-Analysis";

    return name
      .replace(/\.[^/.]+$/, "")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "Document-Analysis";
  };

  /* =========================================================
     GET ANALYSIS SECTIONS
  ========================================================= */

  const getExportSections = () => {
    const sections = analysis?.sections || {};

    return [
      {
        title: "Summary",
        content: sections.summary || "None found.",
      },
      {
        title: "Key Points",
        content: sections.keyPoints || "None found.",
      },
      {
        title: "Key Information",
        content:
          sections.keyInformation || "None found.",
      },
      {
        title: "Important Dates",
        content:
          sections.importantDates || "None found.",
      },
      {
        title: "Important Numbers",
        content:
          sections.importantNumbers ||
          "None found.",
      },
      {
        title: "Risks & Issues",
        content:
          sections.risksAndIssues ||
          "None identified.",
      },
      {
        title: "Action Items",
        content:
          sections.actionItems ||
          "None identified.",
      },
      {
        title: "Keywords",
        content: Array.isArray(sections.keywords)
          ? sections.keywords.join(", ")
          : sections.keywords || "None found.",
      },
    ];
  };

  /* =========================================================
     EXPORT PDF
  ========================================================= */

  const handleExportPDF = async () => {
    if (!analysis) {
      setError(
        "Please analyze a document before exporting."
      );
      return;
    }

    try {
      setExportingPDF(true);
      setError("");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 18;
      const contentWidth =
        pageWidth - margin * 2;

      let y = 20;

      const addPageIfNeeded = (height = 10) => {
        if (y + height > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }
      };

      const addWrappedText = (
        text,
        fontSize = 10,
        lineHeight = 5.5
      ) => {
        pdf.setFontSize(fontSize);

        const lines = pdf.splitTextToSize(
          String(text || ""),
          contentWidth
        );

        for (const line of lines) {
          addPageIfNeeded(lineHeight);

          pdf.text(
            line,
            margin,
            y
          );

          y += lineHeight;
        }
      };

      /* Header */

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);

      pdf.text(
        "AI-BOS",
        margin,
        y
      );

      y += 8;

      pdf.setFontSize(16);

      pdf.text(
        "Document Analysis Report",
        margin,
        y
      );

      y += 10;

      /* Divider */

      pdf.setLineWidth(0.3);

      pdf.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 9;

      /* Document information */

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);

      pdf.text(
        "Document",
        margin,
        y
      );

      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      addWrappedText(
        analysis.documentName ||
          "Untitled Document",
        10,
        5
      );

      y += 2;

      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Document Type",
        margin,
        y
      );

      y += 6;

      pdf.setFont("helvetica", "normal");

      addWrappedText(
        analysis.documentType ||
          "General",
        10,
        5
      );

      if (analysis.analyzedAt) {
        y += 2;

        pdf.setFont("helvetica", "bold");

        pdf.text(
          "Analysis Date",
          margin,
          y
        );

        y += 6;

        pdf.setFont("helvetica", "normal");

        addWrappedText(
          new Date(
            analysis.analyzedAt
          ).toLocaleString(),
          10,
          5
        );
      }

      y += 7;

      /* Sections */

      const exportSections =
        getExportSections();

      exportSections.forEach(
        ({ title, content }) => {
          addPageIfNeeded(18);

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.setFontSize(12);

          pdf.text(
            title,
            margin,
            y
          );

          y += 7;

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.setFontSize(10);

          addWrappedText(
            content,
            10,
            5.5
          );

          y += 6;
        }
      );

      /* Footer on every page */

      const totalPages =
        pdf.getNumberOfPages();

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        pdf.setPage(page);

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.text(
          "Generated by AI-BOS Document Intelligence",
          margin,
          pageHeight - 10
        );

        pdf.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          {
            align: "right",
          }
        );
      }

      pdf.save(
        `${getSafeFileName()}-Analysis.pdf`
      );
    } catch (err) {
      console.error(
        "PDF Export Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to export the analysis as PDF."
      );
    } finally {
      setExportingPDF(false);
    }
  };

  /* =========================================================
     EXPORT DOCX
  ========================================================= */

  const handleExportDOCX = async () => {
    if (!analysis) {
      setError(
        "Please analyze a document before exporting."
      );
      return;
    }

    try {
      setExportingDOCX(true);
      setError("");

      const sections =
        getExportSections();

      const children = [];

      /* Title */

      children.push(
        new Paragraph({
          text: "AI-BOS",
          heading: HeadingLevel.TITLE,
        })
      );

      children.push(
        new Paragraph({
          text: "Document Analysis Report",
          heading:
            HeadingLevel.HEADING_1,
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Document: ",
              bold: true,
            }),
            new TextRun({
              text:
                analysis.documentName ||
                "Untitled Document",
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Document Type: ",
              bold: true,
            }),
            new TextRun({
              text:
                analysis.documentType ||
                "General",
            }),
          ],
        })
      );

      if (analysis.analyzedAt) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Analysis Date: ",
                bold: true,
              }),
              new TextRun({
                text: new Date(
                  analysis.analyzedAt
                ).toLocaleString(),
              }),
            ],
          })
        );
      }

      children.push(
        new Paragraph({
          text: "",
        })
      );

      /* Analysis Sections */

      sections.forEach(
        ({ title, content }) => {
          children.push(
            new Paragraph({
              text: title,
              heading:
                HeadingLevel.HEADING_2,
            })
          );

          const text =
            String(content || "").trim();

          const paragraphs =
            text.split(/\n+/);

          paragraphs.forEach(
            (paragraphText) => {
              const cleaned =
                paragraphText.trim();

              if (!cleaned) {
                return;
              }

              children.push(
                new Paragraph({
                  text: cleaned,
                })
              );
            }
          );

          children.push(
            new Paragraph({
              text: "",
            })
          );
        }
      );

      /* Footer */

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                "Generated by AI-BOS Document Intelligence",
              italics: true,
            }),
          ],
        })
      );

      const docx =
        new DocxDocument({
          creator: "AI-BOS",
          title: "Document Analysis Report",
          description:
            "AI-BOS Document Analysis Report",
          sections: [
            {
              properties: {},
              children,
            },
          ],
        });

      const blob =
        await Packer.toBlob(docx);

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download = `${getSafeFileName()}-Analysis.docx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "DOCX Export Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to export the analysis as DOCX."
      );
    } finally {
      setExportingDOCX(false);
    }
  };

  /* =========================================================
     CLEAR ANALYSIS
  ========================================================= */

  const handleClear = () => {
    setAnalysis(null);
    setError("");
    setCopied(false);
  };

  /* =========================================================
     FORMAT FILE SIZE
  ========================================================= */

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(
        date
      ).toLocaleString();
    } catch {
      return "";
    }
  };

  /* =========================================================
     ANALYSIS SECTION
  ========================================================= */

  const AnalysisSection = ({
    icon: Icon,
    title,
    children,
    iconClass =
      "bg-violet-50 text-violet-600",
    className = "",
  }) => {
    return (
      <div
        className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md ${className}`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
          >
            <Icon size={18} />
          </div>

          <h3 className="text-sm font-bold text-slate-800">
            {title}
          </h3>
        </div>

        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {children || "None found."}
        </div>
      </div>
    );
  };

  /* =========================================================
     DOCUMENT CARD
  ========================================================= */

  const DocumentCard = ({
    document,
  }) => {
    const isSelected =
      selectedDocumentId ===
      document._id;

    const isReady =
      document.status === "ready";

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedDocumentId(
            document._id
          );
          setAnalysis(null);
          setError("");
          setCopied(false);
        }}
        className={`group w-full rounded-2xl border p-4 text-left transition duration-200 ${
          isSelected
            ? "border-violet-400 bg-violet-50/70 shadow-sm ring-2 ring-violet-100"
            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* File Icon */}

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
              isSelected
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600"
            }`}
          >
            <FileText size={20} />
          </div>

          {/* Document Info */}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {document.originalName ||
                document.fileName ||
                "Untitled Document"}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span>
                {formatFileSize(
                  document.size
                )}
              </span>

              {document.pages && (
                <>
                  <span>•</span>
                  <span>
                    {document.pages}{" "}
                    {document.pages === 1
                      ? "page"
                      : "pages"}
                  </span>
                </>
              )}

              {document.wordCount && (
                <>
                  <span>•</span>
                  <span>
                    {document.wordCount.toLocaleString()}{" "}
                    words
                  </span>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Status */}

              <span
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                  isReady
                    ? "bg-emerald-50 text-emerald-600"
                    : document.status ===
                      "failed"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {isReady
                  ? "Ready"
                  : document.status ===
                    "failed"
                  ? "Failed"
                  : document.status ||
                    "Processing"}
              </span>

              {/* Document Type */}

              {document.documentType && (
                <span className="max-w-[130px] truncate rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {document.documentType}
                </span>
              )}

              {/* Category */}

              {document.category && (
                <span className="max-w-[130px] truncate rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {document.category}
                </span>
              )}
            </div>
          </div>

          {/* Selected Check */}

          {isSelected && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
              <Check size={14} />
            </div>
          )}
        </div>
      </button>
    );
  };

  const sections =
    analysis?.sections || {};

  const keywordList = Array.isArray(
    sections.keywords
  )
    ? sections.keywords
    : typeof sections.keywords ===
      "string"
    ? sections.keywords
        .split("\n")
        .map((item) =>
          item
            .replace(/^[-*•]\s*/, "")
            .replace(
              /^\d+[.)]\s*/,
              ""
            )
            .trim()
        )
        .filter(Boolean)
    : [];

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-600">
              <Sparkles size={16} />

              <span>
                AI DOCUMENT INTELLIGENCE
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Document Analyzer
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Analyze your documents with AI to discover
              summaries, key information, dates, numbers,
              risks, action items, and important insights.
            </p>
          </div>

          {/* Document Counter */}

          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:w-auto">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FileSearch size={21} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Documents Available
              </p>

              <p className="mt-0.5 text-lg font-bold text-slate-800">
                {documents.length}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            DOCUMENT SELECTION
        ===================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Selection Header */}

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileSearch
                    size={17}
                    className="text-violet-600"
                  />

                  <p className="text-sm font-bold text-slate-800">
                    Select a Document
                  </p>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Choose a ready document from your
                  Document Vault to begin analysis.
                </p>
              </div>

              {/* Search */}

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search documents..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>
          </div>

          {/* Document List */}

          <div className="p-4 sm:p-5">
            {loadingDocuments ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                  <Loader2
                    size={27}
                    className="animate-spin text-violet-600"
                  />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Loading your documents
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait a moment...
                </p>
              </div>
            ) : documents.length ===
              0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileText size={24} />
                </div>

                <p className="text-sm font-bold text-slate-700">
                  No documents found
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Upload a PDF or DOCX document from the
                  Upload Center before using the analyzer.
                </p>
              </div>
            ) : filteredDocuments.length ===
              0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Search size={21} />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  No matching documents
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try a different document name.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map(
                  (document) => (
                    <DocumentCard
                      key={document._id}
                      document={document}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {/* ===================================================
              SELECTED DOCUMENT ACTION
          =================================================== */}

          {selectedDocument && (
            <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                {/* Selected Document */}

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-slate-400">
                        Selected Document
                      </p>

                      {selectedDocument.status ===
                        "ready" && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          READY
                        </span>
                      )}
                    </div>

                    <p className="truncate text-sm font-bold text-slate-800">
                      {selectedDocument.originalName ||
                        selectedDocument.fileName}
                    </p>
                  </div>
                </div>

                {/* Analyze Button */}

                <button
                  type="button"
                  onClick={() =>
                    handleAnalyze(false)
                  }
                  disabled={
                    analyzing ||
                    selectedDocument.status !==
                      "ready"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                >
                  {analyzing ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />

                      Analyze Document
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <XCircle
                size={18}
                className="text-red-500"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-red-700">
                Analysis Error
              </p>

              <p className="mt-0.5 text-sm leading-6 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            ANALYZING STATE
        ===================================================== */}

        {analyzing && (
          <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50">
                <div className="absolute inset-0 animate-ping rounded-3xl bg-violet-100 opacity-50" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
                  <Loader2
                    size={27}
                    className="animate-spin"
                  />
                </div>
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-800">
                Analyzing your document
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                AI-BOS is reading the document and
                extracting useful information. Please wait
                while the analysis is being generated.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
                  Reading
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  Extracting
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Processing
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ANALYSIS RESULT
        ===================================================== */}

        {analysis && !analyzing && (
          <div className="space-y-5">

            {/* =================================================
                RESULT HEADER
            ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  {/* Document Identity */}

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
                      <FileSearch size={25} />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          AI Analysis Complete
                        </span>

                        {analysis.cached && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                            Saved Result
                          </span>
                        )}
                      </div>

                      <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                        {analysis.documentName ||
                          "Document Analysis"}
                      </h2>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {analysis.documentType && (
                          <span>
                            {analysis.documentType}
                          </span>
                        )}

                        {analysis.analyzedAt && (
                          <>
                            <span>•</span>

                            <span>
                              Analyzed{" "}
                              {formatDate(
                                analysis.analyzedAt
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">

                    {/* Copy */}

                    <button
                      type="button"
                      onClick={handleCopyAnalysis}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Clipboard size={16} />
                          Copy
                        </>
                      )}
                    </button>

                    {/* PDF */}

                    <button
                      type="button"
                      onClick={
                        handleExportPDF
                      }
                      disabled={
                        exportingPDF ||
                        exportingDOCX
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {exportingPDF ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          PDF...
                        </>
                      ) : (
                        <>
                          <Download
                            size={16}
                          />
                          PDF
                        </>
                      )}
                    </button>

                    {/* DOCX */}

                    <button
                      type="button"
                      onClick={
                        handleExportDOCX
                      }
                      disabled={
                        exportingPDF ||
                        exportingDOCX
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {exportingDOCX ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          DOCX...
                        </>
                      ) : (
                        <>
                          <Download
                            size={16}
                          />
                          DOCX
                        </>
                      )}
                    </button>

                    {/* Re-analyze */}

                    <button
                      type="button"
                      onClick={() =>
                        handleAnalyze(true)
                      }
                      disabled={
                        analyzing ||
                        exportingPDF ||
                        exportingDOCX
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-600 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {analyzing ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Re-analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />

                          Re-analyze
                        </>
                      )}
                    </button>

                    {/* Clear */}

                    <button
                      type="button"
                      onClick={
                        handleClear
                      }
                      disabled={
                        exportingPDF ||
                        exportingDOCX
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />

                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Meta */}

              <div className="grid border-t border-slate-100 sm:grid-cols-3">
                <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Provider
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {analysis.provider ||
                      "AI-BOS"}
                  </p>
                </div>

                <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Model
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {analysis.model ||
                      "Configured AI Model"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    <p className="text-sm font-semibold text-emerald-600">
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <AnalysisSection
              icon={FileText}
              title="Summary"
              iconClass="bg-violet-50 text-violet-600"
              className="border-violet-100"
            >
              {sections.summary}
            </AnalysisSection>

            {/* =================================================
                KEY INFORMATION GRID
            ================================================= */}

            <div className="grid gap-5 lg:grid-cols-2">

              <AnalysisSection
                icon={Target}
                title="Key Points"
                iconClass="bg-violet-50 text-violet-600"
              >
                {sections.keyPoints}
              </AnalysisSection>

              <AnalysisSection
                icon={KeyRound}
                title="Key Information"
                iconClass="bg-blue-50 text-blue-600"
              >
                {sections.keyInformation}
              </AnalysisSection>

              <AnalysisSection
                icon={CalendarDays}
                title="Important Dates"
                iconClass="bg-amber-50 text-amber-600"
              >
                {sections.importantDates}
              </AnalysisSection>

              <AnalysisSection
                icon={Hash}
                title="Important Numbers"
                iconClass="bg-emerald-50 text-emerald-600"
              >
                {sections.importantNumbers}
              </AnalysisSection>

              <AnalysisSection
                icon={AlertTriangle}
                title="Risks & Issues"
                iconClass="bg-red-50 text-red-600"
              >
                {sections.risksAndIssues}
              </AnalysisSection>

              <AnalysisSection
                icon={Check}
                title="Action Items"
                iconClass="bg-cyan-50 text-cyan-600"
              >
                {sections.actionItems}
              </AnalysisSection>
            </div>

            {/* =================================================
                KEYWORDS
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Hash size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Keywords
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Important topics identified from the
                    document
                  </p>
                </div>
              </div>

              {keywordList.length >
              0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywordList.map(
                    (
                      keyword,
                      index
                    ) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-100"
                      >
                        {keyword}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  None found.
                </p>
              )}
            </div>

            {/* =================================================
                ANALYSIS FOOTER
            ================================================= */}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Sparkles size={15} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    AI-BOS Document Intelligence
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Analysis generated from your document
                    content.
                  </p>
                </div>
              </div>

              <div className="text-left text-[11px] text-slate-400 sm:text-right">
                {analysis.analyzedAt && (
                  <p>
                    Last analyzed:{" "}
                    {formatDate(
                      analysis.analyzedAt
                    )}
                  </p>
                )}

                {analysis.cached && (
                  <p className="mt-0.5 font-medium text-blue-500">
                    Loaded from saved analysis
                  </p>
                )}
              </div>
            </div>

            {/* =================================================
                ANALYSIS HISTORY
            ================================================= */}

            <AnalysisHistoryPanel
              history={analysisHistory}
              loading={loadingHistory}
              selectedHistoryId={
                selectedHistoryId
              }
              pagination={historyPagination}
              onView={handleViewHistory}
              onDelete={handleDeleteHistory}
              onPageChange={
                handleHistoryPageChange
              }
            />
          </div>
        )}

        {!analysis &&
          !analyzing &&
          !error &&
          documents.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative px-6 py-12 text-center sm:px-12 sm:py-16">
                <div className="absolute left-0 right-0 top-0 h-1 bg-violet-600" />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <FileSearch size={28} />
                </div>

                <div className="mt-5">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Ready
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-800">
                  Ready to analyze
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Select a document above and click{" "}
                  <span className="font-semibold text-slate-600">
                    Analyze Document
                  </span>{" "}
                  to generate AI-powered document
                  intelligence.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}