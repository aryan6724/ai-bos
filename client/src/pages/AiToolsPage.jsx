import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Filter,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  Wrench,
  Zap,
  FilePenLine,
  Languages,
  FileSearch,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";
import { getFullAnalytics } from "../services/analyticsService";

const tools = [
  {
    title: "AI Document Generator",
    description:
      "Generate professional resumes, emails, reports, and business documents using AI.",
    icon: Wand2,
    to: "/dashboard/ai-generator",
    status: "Ready",
    badge: "Core AI",
    category: "Generation",
  },
  {
    title: "Text Improver",
    description:
      "Improve grammar, clarity, tone, professionalism, and readability of any text using AI.",
    icon: Wand2,
    to: "/dashboard/ai-tools/text-improver",
    status: "Ready",
    badge: "AI Writing",
    category: "Writing",
  },
  {
  title: "Text Summarizer",
  description:
    "Summarize long text into clear insights, bullet points, key takeaways, and action items.",
  icon: FileText,
  to: "/dashboard/ai-tools/text-summarizer",
  status: "Ready",
  badge: "AI Summary",
  category: "Writing",
},

{
  title: "Text Rewriter",
  description:
    "Paraphrase, simplify, formalize, or transform text while preserving its original meaning.",
  icon: FilePenLine,
  to: "/dashboard/ai-tools/text-rewriter",
  status: "Ready",
  badge: "AI Writing",
  category: "Writing",
},

{
  title: "Text Translator",
  description:
    "Translate text across multiple languages while preserving meaning, details, and tone.",
  icon: Languages,
  to: "/dashboard/ai-tools/text-translator",
  status: "Ready",
  badge: "AI Writing",
  category: "Writing",
},

{
  title: "Document Analyzer",
  description:
    "Analyze uploaded documents with AI to extract summaries, key points, dates, numbers, risks, and action items.",
  icon: FileSearch,
  to: "/dashboard/ai-tools/document-analyzer",
  status: "Ready",
  badge: "Document AI",
  category: "Documents",
},

  {
    title: "Document Chat",
    description:
      "Ask questions from uploaded PDF, TXT, and DOCX documents using document intelligence.",
    icon: MessageSquareText,
    to: "/dashboard/document-chat",
    status: "Ready",
    badge: "RAG",
    category: "Documents",
  },
  {
    title: "Upload Center",
    description:
      "Upload and manage documents for AI-powered document analysis and workspace storage.",
    icon: UploadCloud,
    to: "/dashboard/uploads",
    status: "Ready",
    badge: "Vault",
    category: "Documents",
  },
  {
    title: "Document Vault",
    description:
      "View, manage, delete, and open uploaded workspace documents for AI-BOS.",
    icon: FileText,
    to: "/dashboard/documents",
    status: "Ready",
    badge: "Storage",
    category: "Documents",
  },
  {
    title: "Analytics Engine",
    description:
      "Track AI generations, document chats, uploads, team data, and workspace usage.",
    icon: BarChart3,
    to: "/dashboard/analytics",
    status: "Ready",
    badge: "Live Data",
    category: "Insights",
  },
  {
    title: "Admin Intelligence",
    description:
      "Monitor system health, access control, workspace readiness, and admin security.",
    icon: ShieldCheck,
    to: "/dashboard/admin",
    status: "Secured",
    badge: "Admin",
    category: "Administration",
  },
];

function ToolCard({ tool }) {
  const Icon = tool.icon;

  return (
    <Link to={tool.to} className="block h-full">
      <Card
        hover
        className="group flex h-full flex-col p-5 transition hover:border-cyan-400/40 hover:bg-cyan-400/5 sm:p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
            <Icon size={25} />
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {tool.badge}
            </span>

            <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              <CheckCircle2 size={12} />
              {tool.status}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white">{tool.title}</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {tool.description}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-sm font-medium text-cyan-300">
            Open Tool
          </span>

          <ArrowRight
            size={18}
            className="text-cyan-300 transition group-hover:translate-x-1"
          />
        </div>
      </Card>
    </Link>
  );
}

function UsageMetric({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={23} />
        </div>
      </div>
    </Card>
  );
}

export default function AiToolsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const loadToolsData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getFullAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI tools data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadToolsData();
  }, []);

  const overview = analytics?.overview || {
    totalGenerations: 0,
    totalDocuments: 0,
    totalChats: 0,
    totalRequests: 0,
  };

  const categories = useMemo(
    () => ["All", ...new Set(tools.map((tool) => tool.category))],
    []
  );

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesCategory =
        category === "All" || tool.category === category;

      const matchesSearch =
        !query ||
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.badge.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <DashboardPageHeader
          badge="AI Tools Command Center"
          title="AI Tools"
          description="Access every AI-BOS intelligence module from one premium workspace: AI generation, text improvement, document chat, uploads, analytics, and admin tools."
        />

        <button
          type="button"
          onClick={loadToolsData}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <Loader2 className="animate-spin text-cyan-300" size={42} />
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <UsageMetric
              title="AI Generations"
              value={overview.totalGenerations}
              icon={Sparkles}
            />

            <UsageMetric
              title="Document Chats"
              value={overview.totalChats}
              icon={MessageSquareText}
            />

            <UsageMetric
              title="Documents"
              value={overview.totalDocuments}
              icon={FileText}
            />

            <UsageMetric
              title="Total AI Requests"
              value={overview.totalRequests}
              icon={Activity}
            />
          </section>

          <section className="mb-6">
            <Card className="overflow-hidden p-6">
              <div className="relative">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute -bottom-20 left-20 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                      <Zap size={16} />
                      Premium AI-BOS Intelligence Layer
                    </div>

                    <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      Everything your workspace needs to generate, analyze, and
                      understand documents.
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                      This AI tools page connects all major AI-BOS modules into
                      one command center. It helps interviewers clearly see your
                      AI workflows, document intelligence, analytics, and SaaS
                      architecture.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-slate-400">System Status</p>

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                        All Systems Ready
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        "AI Generator connected",
                        "Document Chat connected",
                        "Uploads connected",
                        "Analytics connected",
                        "Admin controls connected",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <CheckCircle2
                            className="text-emerald-300"
                            size={18}
                          />
                          <span className="text-sm text-slate-300">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm text-slate-400">Available Modules</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  AI-BOS Tool Suite
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Search and filter every connected workspace intelligence module
                  from one place.
                </p>
              </div>

              <div className="text-sm text-slate-500">
                {filteredTools.length} of {tools.length} tools
              </div>
            </div>

            <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search AI tools..."
                  aria-label="Search AI tools"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:bg-white/[0.06]"
                />
              </label>

              <label className="relative block min-w-0 lg:min-w-[220px]">
                <Filter
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-label="Filter AI tools by category"
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400/40"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredTools.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.title} tool={tool} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/[0.04] text-slate-500">
                  <Search size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  No tools found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or reset the category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Reset Filters
                </button>
              </Card>
            )}
          </section>

          <section className="mt-6">
            <Card className="overflow-hidden p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                    <Wrench size={21} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">Coming Next</p>
                    <h2 className="text-xl font-semibold text-white">
                      More AI Productivity Tools
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Text Improver is now live. More focused tools for summarizing,
                      rewriting, reviewing, and extracting useful information from
                      text are coming next.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                  Step 3.7
                </span>
              </div>
            </Card>
          </section>

          <section className="mt-6">
            <Card className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Foundation Status</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    AI Tools command center is ready
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Tool discovery, search, category filtering, responsive cards,
                    loading states, refresh, and empty states are now in place.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-emerald-200">
                  <CheckCircle2 size={18} />
                  Foundation Ready
                </div>
              </div>
            </Card>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}