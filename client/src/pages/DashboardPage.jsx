import { useEffect, useState } from "react";
import {
  Brain,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import StatCard from "../components/dashboard/StatCard";
import AnalyticsPreview from "../components/dashboard/AnalyticsPreview";
import RecentActivity from "../components/dashboard/RecentActivity";
import { getDashboardOverview } from "../services/analyticsService";

const iconMap = {
  generations: Brain,
  documents: FileText,
  team: Users,
  chats: MessageSquareText,
};

const fallbackStats = [
  {
    key: "generations",
    title: "AI Generations",
    value: "0",
    change: "+ live",
    icon: Brain,
  },
  {
    key: "documents",
    title: "Documents",
    value: "0",
    change: "+ live",
    icon: FileText,
  },
  {
    key: "team",
    title: "Team Members",
    value: "0",
    change: "+ live",
    icon: Users,
  },
  {
    key: "chats",
    title: "Document Chats",
    value: "0",
    change: "+ live",
    icon: MessageSquareText,
  },
];

const tools = [
  {
    title: "AI Generator",
    description: "Generate resumes, emails, reports, and business content.",
    status: "Ready",
  },
  {
    title: "Document Chat",
    description: "Ask questions from uploaded PDFs, TXT, and DOCX files.",
    status: "Ready",
  },
  {
    title: "Team Management",
    description: "Manage users, roles, and workspace access.",
    status: "Ready",
  },
  {
    title: "Analytics",
    description: "Track real usage, activity, and workspace performance.",
    status: "Ready",
  },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [error, setError] = useState("");

  const stats =
    overview?.stats?.map((stat) => ({
      ...stat,
      icon: iconMap[stat.key] || Brain,
    })) || fallbackStats;

  const loadOverview = async () => {
    try {
      setIsLoadingOverview(true);
      setError("");

      const data = await getDashboardOverview();
      setOverview(data);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <DashboardLayout>
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
            AI Business Command Center
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Dashboard Overview
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Monitor real AI usage, uploaded documents, team activity, and
            document intelligence workflows from one premium SaaS dashboard.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadOverview}
            disabled={isLoadingOverview}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingOverview ? "Refreshing..." : "Refresh"}
          </button>

          {/* Connected to the existing AI Tools workflow instead of being a dead button. */}
          <Link
            to="/ai-tools"
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <Plus size={18} />
            New AI Task
          </Link>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={isLoadingOverview ? "..." : stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <AnalyticsPreview
          usageBars={overview?.usageBars || []}
          totalRequests={overview?.summary?.totalRequests || "0"}
          successRate={overview?.summary?.successRate || "98.4%"}
          avgResponseTime={overview?.summary?.avgResponseTime || "1.2s"}
        />

        <RecentActivity activities={overview?.recentActivities || []} />
      </section>

      <section className="mt-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Product Modules</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              AI Tools Workspace
            </h2>
          </div>

          <Link
            to="/ai-tools"
            className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
          >
            Manage tools
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <Card key={tool.title} hover className="p-5">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                  <Sparkles size={22} />
                </div>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {tool.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">{tool.title}</h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {tool.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
