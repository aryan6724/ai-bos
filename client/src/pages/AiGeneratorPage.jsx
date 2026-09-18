import MarkdownPreview from "../components/ui/MarkdownPreview";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  generateDocument,
  getGenerationHistory,
  deleteGeneration,
  deleteAllGenerations,
} from "../services/aiService";

const generatorTypes = [
  {
    label: "Resume",
    value: "resume",
    icon: FileText,
  },
  {
    label: "Email",
    value: "email",
    icon: Mail,
  },
  {
    label: "Report",
    value: "report",
    icon: Sparkles,
  },
];

const initialInput = {
  resume: {
    fullName: "",
    targetRole: "",
    experienceLevel: "",
    skills: "",
    projects: "",
    education: "",
    tone: "Professional",
  },

  email: {
    purpose: "",
    recipient: "",
    senderName: "",
    tone: "Professional",
    keyPoints: "",
  },

  report: {
    title: "",
    projectName: "",
    summary: "",
    completed: "",
    challenges: "",
    nextSteps: "",
    tone: "Professional",
  },
};

function TextareaField({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  required = false,
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-300">
        {label}

        {required && (
          <span className="text-cyan-400">*</span>
        )}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-400/10"
      />

      {value && (
        <p className="mt-1.5 text-right text-[11px] text-slate-600">
          {value.length} characters
        </p>
      )}
    </label>
  );
}

export default function AiGeneratorPage() {
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get("type");
  const safeDefaultType = ["resume", "email", "report"].includes(queryType)
    ? queryType
    : "resume";

  const [type, setType] = useState(safeDefaultType);
  const [formData, setFormData] = useState(initialInput[safeDefaultType]);
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState("");
  const [error, setError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(6);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  const selectedType = generatorTypes.find((item) => item.value === type);
  const historyItems = Array.isArray(history) ? history : [];
  const SelectedIcon = selectedType?.icon || FileText;

  const filteredHistory = historyItems;

  const loadHistory = async (showRefreshing = false, requestedPage = historyPage) => {
    try {
      if (showRefreshing) setIsRefreshingHistory(true);

      const data = await getGenerationHistory({
        page: requestedPage,
        pageSize: historyPageSize,
        search: historySearch,
        type: historyFilter,
      });

      const generations = Array.isArray(data?.generations)
        ? data.generations
        : Array.isArray(data)
          ? data
          : [];

      setHistory(generations);
      setHistoryTotal(Number(data?.total) || generations.length);
      setHistoryTotalPages(Number(data?.totalPages) || (generations.length ? 1 : 0));
    } catch (err) {
      console.error(
        "History load failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load generation history. Please try again."
      );
    } finally {
      if (showRefreshing) setIsRefreshingHistory(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHistory(false, historyPage);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [historyPage, historySearch, historyFilter]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData(initialInput[newType]);
    setOutput("");
    setSelectedHistoryId("");
    setError("");
    setIsCopied(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const validateForm = () => {
  const requiredFields = {
    resume: [
      ["fullName", "Full Name"],
      ["targetRole", "Target Role"],
      ["experienceLevel", "Experience Level"],
      ["education", "Education"],
      ["skills", "Skills"],
      ["projects", "Projects"],
    ],

    email: [
      ["purpose", "Purpose"],
      ["recipient", "Recipient"],
      ["senderName", "Sender Name"],
      ["tone", "Tone"],
      ["keyPoints", "Key Points"],
    ],

    report: [
      ["title", "Report Title"],
      ["projectName", "Project Name"],
      ["tone", "Tone"],
      ["summary", "Summary"],
      ["completed", "Completed Work"],
      ["challenges", "Challenges"],
      ["nextSteps", "Next Steps"],
    ],
  };

  const fields = requiredFields[type] || [];

  for (const [field, label] of fields) {
    if (!String(formData[field] || "").trim()) {
      setError(`Please enter ${label}.`);
      return false;
    }
  }

  return true;
};

const handleGenerate = async (event) => {
  event?.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    setIsGenerating(true);
    setError("");
    setOutput("");
    setIsCopied(false);

    const data = await generateDocument({
      type,
      input: formData,
    });

    setOutput(data.generation.output);
    await loadHistory();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "AI generation failed. Check backend, token, or AI provider configuration."
    );
  } finally {
    setIsGenerating(false);
  }
};

const handleRegenerate = async () => {
  if (isGenerating) {
    return;
  }

  await handleGenerate();
};

  const handleDownload = () => {
    if (!output) return;

    const blob = new Blob([output], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedType?.label || "AI-Document"}-${Date.now()}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditOutput = () => {
    if (!output) return;
    setEditedOutput(output);
    setIsEditing(true);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditedOutput(output);
    setIsEditing(false);
  };

  const handleSaveEditedOutput = () => {
    const nextOutput = editedOutput.trim();

    if (!nextOutput) {
      setError("Edited document cannot be empty.");
      return;
    }

    setOutput(nextOutput);
    setEditedOutput(nextOutput);
    setIsEditing(false);
    setIsCopied(false);
    setError("");
  };

  const handleEditAndRegenerate = async () => {
    const nextOutput = editedOutput.trim();

    if (!nextOutput) {
      setError("Please enter some content before regenerating.");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");
      setIsEditing(false);
      setOutput("");
      setIsCopied(false);

      const data = await generateDocument({
        type,
        input: {
          ...formData,
          previousDraft: nextOutput,
        },
      });

      setOutput(data.generation.output);
      setEditedOutput(data.generation.output);
      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "AI regeneration failed. Check backend, token, or AI provider configuration."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 1800);
    } catch {
      setError("Copy failed. Please select and copy the output manually.");
    }
  };

const handleDeleteGeneration = async () => {
  if (!deleteTarget?._id || isDeletingHistory) return;

  const id = deleteTarget._id;
  try {
    setIsDeletingHistory(true);
    setError("");

    await deleteGeneration(id);

    const remainingOnPage = historyItems.length - 1;
    const nextPage = remainingOnPage === 0 && historyPage > 1
      ? historyPage - 1
      : historyPage;

    if (nextPage !== historyPage) {
      setHistoryPage(nextPage);
    } else {
      await loadHistory(true, historyPage);
    }

    if (selectedHistoryId === id) {
      setSelectedHistoryId("");
      setOutput("");
      setEditedOutput("");
      setIsEditing(false);
      setIsCopied(false);
    }

    setDeleteTarget(null);
  } catch (err) {
    console.error(
      "Generation delete failed:",
      err.response?.data || err.message
    );

    setError(
      err.response?.data?.message ||
        "Failed to delete this generation. Please try again."
    );
  } finally {
    setIsDeletingHistory(false);
  }
};

const handleClearHistory = async () => {
  if (isDeletingHistory) return;

  try {
    setIsDeletingHistory(true);
    setError("");

    await deleteAllGenerations();

    setHistory([]);
    setHistoryTotal(0);
    setHistoryTotalPages(0);
    setHistoryPage(1);
    setSelectedHistoryId("");
    setOutput("");
    setEditedOutput("");
    setIsEditing(false);
    setIsCopied(false);
    setHistorySearch("");
    setHistoryFilter("all");
    setShowClearHistoryConfirm(false);
  } catch (err) {
    console.error(
      "Generation history clear failed:",
      err.response?.data || err.message
    );

    setError(
      err.response?.data?.message ||
        "Failed to clear generation history. Please try again."
    );
  } finally {
    setIsDeletingHistory(false);
  }
};

const handleHistoryPreview = (item) => {
  setSelectedHistoryId(item._id);

  setType(item.type);

  setFormData({
    ...initialInput[item.type],
    ...item.input,
  });

  setOutput(item.output);

  setError("");

  setIsCopied(false);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  const renderFields = () => {
    if (type === "resume") {
      return (
        <>
          <Input
  label="Full Name"
  name="fullName"
  value={formData.fullName}
  onChange={handleChange}
  placeholder="e.g. John Smith"
  required
/>

          <Input
  label="Target Role"
  name="targetRole"
  value={formData.targetRole}
  onChange={handleChange}
  placeholder="e.g. Full Stack Developer"
  required
/>

          <Input
  label="Experience Level"
  name="experienceLevel"
  value={formData.experienceLevel}
  onChange={handleChange}
  placeholder="e.g. Fresher, 2 years, Senior"
  required
/>

         <Input
  label="Education"
  name="education"
  value={formData.education}
  onChange={handleChange}
  placeholder="e.g. B.Tech Computer Science"
  required
/>

          <TextareaField
  label="Skills"
  name="skills"
  value={formData.skills}
  onChange={handleChange}
  rows={4}
  placeholder="e.g. React, Node.js, MongoDB, Git, REST APIs..."
  required
/>

          <TextareaField
  label="Projects"
  name="projects"
  value={formData.projects}
  onChange={handleChange}
  rows={5}
  placeholder="Describe your important projects, your role, and the technologies used..."
  required
/>
        </>
      );
    }

    if (type === "email") {
      return (
        <>
          <Input
  label="Purpose"
  name="purpose"
  value={formData.purpose}
  onChange={handleChange}
  placeholder="e.g. Internship application"
  required
/>

          <Input
  label="Recipient"
  name="recipient"
  value={formData.recipient}
  onChange={handleChange}
  placeholder="e.g. Hiring Manager"
  required
/>

         <Input
  label="Sender Name"
  name="senderName"
  value={formData.senderName}
  onChange={handleChange}
  placeholder="Your name"
  required
/>

          <Input
  label="Tone"
  name="tone"
  value={formData.tone}
  onChange={handleChange}
  placeholder="e.g. Professional, Friendly, Formal"
  required
/>

          <TextareaField
  label="Key Points"
  name="keyPoints"
  value={formData.keyPoints}
  onChange={handleChange}
  rows={6}
  placeholder="Enter the important points you want the email to communicate..."
  required
/>
        </>
      );
    }

    return (
      <>
        <Input
  label="Report Title"
  name="title"
  value={formData.title}
  onChange={handleChange}
  placeholder="e.g. Q3 Project Progress Report"
  required
/>

        <Input
  label="Project Name"
  name="projectName"
  value={formData.projectName}
  onChange={handleChange}
  placeholder="e.g. AI-BOS"
  required
/>

        <Input
  label="Tone"
  name="tone"
  value={formData.tone}
  onChange={handleChange}
  placeholder="e.g. Professional"
  required
/>
        <TextareaField
  label="Summary"
  name="summary"
  value={formData.summary}
  onChange={handleChange}
  rows={5}
  placeholder="Briefly describe the project, purpose, and current status..."
  required
/>

       <TextareaField
  label="Completed Work"
  name="completed"
  value={formData.completed}
  onChange={handleChange}
  rows={5}
  placeholder="List the major work, features, milestones, or deliverables completed..."
  required
/>

       <TextareaField
  label="Challenges"
  name="challenges"
  value={formData.challenges}
  onChange={handleChange}
  rows={5}
  placeholder="Describe technical, business, or implementation challenges..."
  required
/>

        <TextareaField
  label="Next Steps"
  name="nextSteps"
  value={formData.nextSteps}
  onChange={handleChange}
  rows={5}
  placeholder="Describe planned improvements, upcoming milestones, or remaining work..."
  required
/>
      </>
    );
  };

  return (
    <DashboardLayout>
      <DashboardPageHeader
        badge="AI Document Generator"
        title="Generate Business Documents"
        description="Create professional resumes, emails, and project reports using AI-powered document workflows."
      />

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-4 sm:p-6">
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {generatorTypes.map((item) => {
    const Icon = item.icon;
    const isActive = item.value === type;

    const descriptions = {
      resume: "Create an ATS-friendly professional resume.",
      email: "Write polished and professional emails.",
      report: "Generate structured business and project reports.",
    };

    return (
      <button
        key={item.value}
        type="button"
        onClick={() => handleTypeChange(item.value)}
        className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200 ${
          isActive
            ? "border-cyan-400/40 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
            : "border-white/10 bg-white/[0.03] hover:border-cyan-400/20 hover:bg-white/[0.05]"
        }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
            <Check size={12} strokeWidth={3} />
          </div>
        )}

        {/* Icon */}
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition ${
            isActive
              ? "bg-cyan-400 text-slate-950"
              : "bg-white/[0.05] text-slate-400 group-hover:bg-cyan-400/10 group-hover:text-cyan-300"
          }`}
        >
          <Icon size={19} />
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-semibold ${
            isActive ? "text-white" : "text-slate-200"
          }`}
        >
          {item.label}
        </h3>

        {/* Description */}
        <p className="mt-1.5 pr-5 text-xs leading-5 text-slate-500">
          {descriptions[item.value]}
        </p>
      </button>
    );
  })}
</div>

          {error && (
  <div
    role="alert"
    className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4"
  >
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400/10 text-xs font-bold text-rose-300">
      !
    </div>

    <div>
      <p className="text-sm font-medium text-rose-200">
        Please check your input
      </p>

      <p className="mt-1 text-xs leading-5 text-rose-300/70">
        {error}
      </p>
    </div>
  </div>
)}

          <form onSubmit={handleGenerate}>
            <div className="grid gap-5 md:grid-cols-2">{renderFields()}</div>

<div className="mt-5 flex items-center justify-between gap-3 text-xs">
  <p className="text-slate-600">
    AI-BOS will use the information you provide to generate your document.
  </p>

  <span className="shrink-0 text-slate-600">
    {Object.values(formData).filter(
      (value) => String(value || "").trim()
    ).length}{" "}
    fields completed
  </span>
</div>

            <Button
  type="submit"
  size="lg"
  className="mt-6 w-full"
  disabled={isGenerating}
>
  {isGenerating ? (
    <>
      <Loader2
        className="animate-spin"
        size={19}
      />
      AI is working...
    </>
  ) : (
    <>
      <Wand2 size={19} />
      Generate {selectedType?.label || "Document"}
    </>
  )}
</Button>
          </form>
        </Card>

        <div className="space-y-6">
  {/* =========================================================
      GENERATED OUTPUT
  ========================================================= */}

  <Card className="overflow-hidden p-0">
    {/* Header */}
    <div className="border-b border-white/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Sparkles size={20} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300/70">
              AI Generated Content
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              {output ? "AI Result" : "Generated Output"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {output
                ? `${selectedType?.label || "Document"} generated successfully`
                : "Your generated document will appear here"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
  <Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={handleRegenerate}
    disabled={isGenerating || !output}
    className="w-full sm:w-auto"
  >
    <Wand2
      size={16}
      className={isGenerating ? "animate-spin" : ""}
    />
    Regenerate
  </Button>

  <Button
    type="button"
    variant={isCopied ? "primary" : "secondary"}
    size="sm"
    onClick={handleCopy}
    disabled={!output || isGenerating}
    className="w-full sm:w-auto"
  >
    {isCopied ? (
      <>
        <Check size={16} />
        Copied
      </>
    ) : (
      <>
        <Copy size={16} />
        Copy
      </>
    )}
  </Button>

  <Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={handleDownload}
    disabled={!output || isGenerating}
    className="w-full sm:w-auto"
  >
    <Download size={16} />
    Download
  </Button>

  <Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={handleEditOutput}
    disabled={!output || isGenerating}
    className="w-full sm:w-auto"
  >
    <FileText size={16} />
    Edit
  </Button>
</div>

      </div>
    </div>

    {/* Output Area */}
    <div className="p-4 sm:p-6">
      <div className="premium-scrollbar min-h-[360px] max-h-[620px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 sm:min-h-[420px] sm:max-h-[680px]">
        {isGenerating ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
              <Sparkles
                size={25}
                className="animate-pulse"
              />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              AI is generating your document
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Please wait while AI-BOS creates a professional{" "}
              {selectedType?.label?.toLowerCase() || "document"} for you.
            </p>

            <div className="mt-5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
            </div>
          </div>
        ) : output ? (
          <div className="p-5 sm:p-6">
            {/* Result status */}
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <Check size={15} />
                </div>

                <div>
                  <p className="text-xs font-medium text-emerald-200">
                    Generation Complete
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Ready to review and copy
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-cyan-400/10 bg-cyan-400/5 px-2.5 py-1 text-[11px] capitalize text-cyan-300">
                {type}
              </span>
            </div>

            {/* Start New / Edit */}
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Want to make changes?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Update the information on the left and regenerate the document.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOutput("");
                  setSelectedHistoryId("");
                  setError("");
                  setIsCopied(false);
                  setIsEditing(false);
                  setEditedOutput("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/5 hover:text-cyan-200"
              >
                Start New
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Edit Generated Document
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Make changes to the draft, save them, or regenerate an improved version with AI.
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] text-slate-600">
                      {editedOutput.length} characters
                    </span>
                  </div>

                  <textarea
                    value={editedOutput}
                    onChange={(event) => {
                      setEditedOutput(event.target.value);
                      setError("");
                    }}
                    rows={18}
                    className="premium-scrollbar min-h-[420px] w-full resize-y rounded-2xl border border-cyan-400/20 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-400/10"
                    placeholder="Edit your generated document here..."
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isGenerating}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveEditedOutput}
                    disabled={isGenerating}
                    className="w-full sm:w-auto"
                  >
                    <Check size={16} />
                    Save Changes
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEditAndRegenerate}
                    disabled={isGenerating || !editedOutput.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Wand2 size={16} />
                    Edit & Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <MarkdownPreview content={output} />
            )}
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-slate-600">
              <SelectedIcon size={28} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-300">
              Nothing generated yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Fill in the details on the left and click{" "}
              <span className="text-slate-400">
                Generate {selectedType?.label || "Document"}
              </span>{" "}
              to create your AI-powered content.
            </p>
          </div>
        )}
      </div>
    </div>
  </Card>

  {/* =========================================================
      RECENT GENERATIONS
  ========================================================= */}

  <Card className="p-5 sm:p-6">
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        Generation History
      </p>

      <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
        Recent Generations
      </h2>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        Quickly reopen your previously generated documents.
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {historyItems.length > 0 && (
        <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400 sm:inline-flex">
          {historyItems.length} saved
        </span>
      )}

      {historyItems.length > 0 && (
        <button
          type="button"
          onClick={() => setShowClearHistoryConfirm(true)}
          disabled={isDeletingHistory || isRefreshingHistory}
          title="Clear all generation history"
          className="hidden h-9 items-center gap-2 rounded-xl border border-rose-400/10 bg-rose-400/5 px-3 text-xs font-medium text-rose-300 transition hover:border-rose-400/20 hover:bg-rose-400/10 sm:inline-flex disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={14} />
          Clear History
        </button>
      )}

      <button
        type="button"
        onClick={() => loadHistory(true)}
        disabled={isRefreshingHistory}
        title="Refresh generation history"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-cyan-400/20 hover:bg-cyan-400/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={15} className={isRefreshingHistory ? "animate-spin" : ""} />
      </button>
    </div>
  </div>

  {historyItems.length > 0 && (
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="search"
          value={historySearch}
          onChange={(event) => {
          setHistorySearch(event.target.value);
          setHistoryPage(1);
        }}
          placeholder="Search generated documents..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30 focus:bg-white/[0.05]"
        />
      </div>

      <select
        value={historyFilter}
        onChange={(event) => {
          setHistoryFilter(event.target.value);
          setHistoryPage(1);
        }}
        className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-400/30"
      >
        <option value="all">All Types</option>
        <option value="resume">Resume</option>
        <option value="email">Email</option>
        <option value="report">Report</option>
      </select>
    </div>
  )}

  {historyItems.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-slate-600">
        <FileText size={20} />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-400">
        No AI generations yet
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        Your generated resumes, emails, and reports will appear here.
      </p>
    </div>
  ) : filteredHistory.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
      <p className="text-sm font-medium text-slate-400">No matching generations</p>
      <p className="mt-1 text-xs text-slate-600">Try a different search term or document type.</p>
    </div>
  ) : (
    <div className="space-y-3">
      {filteredHistory.map((item) => {
        const isSelected = selectedHistoryId === item._id;

        const HistoryIcon =
          item.type === "resume"
            ? FileText
            : item.type === "email"
              ? Mail
              : Sparkles;

        return (
          <div
            key={item._id}
            role="button"
            tabIndex={0}
            onClick={() => handleHistoryPreview(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleHistoryPreview(item);
              }
            }}
            className={`group w-full cursor-pointer rounded-2xl border p-4 text-left transition duration-200 ${
              isSelected
                ? "border-cyan-400/30 bg-cyan-400/[0.07] shadow-lg shadow-cyan-500/5"
                : "border-white/10 bg-white/[0.025] hover:border-cyan-400/20 hover:bg-cyan-400/[0.04]"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                  isSelected
                    ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-white/[0.04] text-slate-400 group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10 group-hover:text-cyan-300"
                }`}
              >
                <HistoryIcon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                {/* Title + Type */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className={`truncate font-medium ${
                      isSelected
                        ? "text-cyan-100"
                        : "text-white"
                    }`}
                  >
                    {item.title}
                  </p>

                  <span
                    className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-[11px] capitalize ${
                      isSelected
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>

                {/* Preview */}
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {item.output}
                </p>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-600">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "Saved generation"}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      disabled={isDeletingHistory}
                      title="Delete generation"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-500 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>

                    <span
                      className={`text-[11px] transition ${
                      isSelected
                        ? "text-cyan-300"
                        : "text-cyan-400/60 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isSelected ? "Loaded âœ“" : "Open â†’"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}

  {historyTotalPages > 1 && (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
      <p className="text-xs text-slate-500">
        Page {historyPage} of {historyTotalPages} Â· {historyTotal} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setHistoryPage((page) => Math.max(page - 1, 1))}
          disabled={historyPage <= 1 || isRefreshingHistory || isDeletingHistory}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setHistoryPage((page) => Math.min(page + 1, historyTotalPages))}
          disabled={historyPage >= historyTotalPages || isRefreshingHistory || isDeletingHistory}
        >
          Next
        </Button>
      </div>
    </div>
  )}
</Card>
</div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <Trash2 size={20} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">Delete Generation?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Are you sure you want to delete <span className="font-medium text-slate-200">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingHistory}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteGeneration}
                disabled={isDeletingHistory}
                className="w-full sm:w-auto"
              >
                {isDeletingHistory ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showClearHistoryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <Trash2 size={20} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">Clear Generation History?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This will permanently delete all your saved AI generations. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowClearHistoryConfirm(false)}
                disabled={isDeletingHistory}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleClearHistory}
                disabled={isDeletingHistory}
                className="w-full sm:w-auto"
              >
                {isDeletingHistory ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Clear History
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}