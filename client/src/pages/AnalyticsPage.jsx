import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Clock3,
  FileText,
  Hash,
  Loader2,
  MessageSquareText,
  Pin,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";
import {
  getFullAnalytics,
  getConversationAnalytics,
} from "../services/analyticsService";

const formatActivityTime = (dateValue) => {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

const formatMinutes = (value) => {
  const minutes = Number(value) || 0;
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const formatRatio = (value) => {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)} : 1`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const iconMap = {
  generation: Sparkles,
  document: FileText,
  chat: MessageSquareText,
};

const getMaxCount = (items = [], key = "count") =>
  Math.max(...items.map((item) => Number(item?.[key]) || 0), 1);

function MetricCard({ title, value, icon: Icon, description }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={23} />
        </div>
      </div>
    </Card>
  );
}

function BreakdownCard({ title, subtitle, items = [], labelKey = "label", valueKey = "count" }) {
  const maxCount = getMaxCount(items, valueKey);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-400">{subtitle}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-slate-400">No data available yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item, index) => {
            const value = Number(item?.[valueKey]) || 0;
            const width = Math.max(Math.round((value / maxCount) * 100), value > 0 ? 8 : 0);
            const label = item?.[labelKey] || `Item ${index + 1}`;

            return (
              <div key={`${label}-${index}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium capitalize text-white">{label}</p>
                  <p className="text-sm text-slate-400">{formatNumber(value)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all duration-700"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ConversationMetric({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function ConversationTimeline({ timeline = [] }) {
  const maxMessages = getMaxCount(timeline, "messages");

  return (
    <Card className="p-6">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Conversation Intelligence</p>
          <h2 className="mt-1 text-xl font-semibold text-white">30-Day Conversation Activity</h2>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-medium text-cyan-300">
          Last 30 Days
        </span>
      </div>

      {timeline.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div>
            <BarChart3 className="mx-auto text-slate-600" size={30} />
            <p className="mt-3 text-sm text-slate-400">No conversation activity yet.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex h-64 items-end gap-1 overflow-x-auto border-b border-white/10 pb-3 sm:gap-2">
            {timeline.map((item) => {
              const messages = Number(item?.messages) || 0;
              const height = Math.max(
                Math.round((messages / maxMessages) * 100),
                messages > 0 ? 8 : 3
              );

              return (
                <div key={item.date} className="group flex min-w-[18px] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[22px]">
                  <span className="pointer-events-none rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-[10px] text-slate-300 opacity-0 transition group-hover:opacity-100">
                    {messages} messages
                  </span>
                  <div className="flex h-48 w-full max-w-8 items-end rounded-full bg-white/[0.03] p-0.5">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-cyan-200 shadow-lg shadow-cyan-500/20 transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="hidden text-[10px] text-slate-600 sm:block">
                    {new Date(item.date).toLocaleDateString(undefined, { day: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400">Messages</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {formatNumber(timeline.reduce((sum, item) => sum + (Number(item?.messages) || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">User Messages</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {formatNumber(timeline.reduce((sum, item) => sum + (Number(item?.userMessages) || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">AI Messages</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {formatNumber(timeline.reduce((sum, item) => sum + (Number(item?.assistantMessages) || 0), 0))}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function TopConversations({ conversations = [] }) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-400">Conversation Intelligence</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Top Conversations</h2>
      </div>

      {conversations.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-slate-400">No conversations available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation, index) => (
            <div
              key={conversation.conversationId || index}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium text-white">
                      {conversation.title || "New Chat"}
                    </p>
                    {conversation.pinned && <Pin size={14} className="shrink-0 text-cyan-300" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span>{formatNumber(conversation.totalMessages)} messages</span>
                    <span>•</span>
                    <span>{formatNumber(conversation.totalCharacters)} characters</span>
                    <span>•</span>
                    <span>{formatActivityTime(conversation.lastMessageAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [conversationAnalytics, setConversationAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingConversations, setIsRefreshingConversations] = useState(false);
  const [error, setError] = useState("");
  const [conversationError, setConversationError] = useState("");

  const loadAnalytics = async ({ silentConversationRefresh = false } = {}) => {
    try {
      setIsLoading(true);
      setError("");

      if (silentConversationRefresh) {
        setIsRefreshingConversations(true);
      }

      const [workspaceResult, conversationResult] = await Promise.allSettled([
        getFullAnalytics(),
        getConversationAnalytics(),
      ]);

      if (workspaceResult.status === "fulfilled") {
        setAnalytics(workspaceResult.value);
      } else {
        throw workspaceResult.reason;
      }

      if (conversationResult.status === "fulfilled") {
        setConversationAnalytics(conversationResult.value?.analytics || null);
        setConversationError("");
      } else {
        console.error("Conversation analytics error:", conversationResult.reason);
        setConversationError(
          conversationResult.reason?.response?.data?.message ||
            conversationResult.reason?.message ||
            "Conversation analytics are temporarily unavailable."
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load analytics.");
    } finally {
      setIsLoading(false);
      setIsRefreshingConversations(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const overview = analytics?.overview || {
    totalGenerations: 0,
    totalDocuments: 0,
    totalChats: 0,
    totalTeamMembers: 0,
    activeTeamMembers: 0,
    totalRequests: 0,
  };

  const weeklyUsage = analytics?.weeklyUsage || [];
  const maxWeeklyCount = getMaxCount(weeklyUsage);
  const recentActivities = analytics?.recentActivities || [];

  const conversationOverview = conversationAnalytics?.overview || {};
  const conversationActivity = conversationAnalytics?.activity || {};
  const conversationAverages = conversationAnalytics?.averages || {};
  const conversationTimeline = conversationAnalytics?.timeline || [];
  const topConversations = conversationAnalytics?.topConversations || [];

  const conversationHealth = useMemo(() => {
    const total = Number(conversationOverview.totalConversations) || 0;
    const active = Number(conversationOverview.activeConversations) || 0;
    const messages = Number(conversationOverview.totalMessages) || 0;

    return {
      activeRate: total ? Math.round((active / total) * 100) : 0,
      messagesPerConversation: Number(conversationAverages.averageMessagesPerConversation) || 0,
      total,
      messages,
    };
  }, [conversationOverview, conversationAverages]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <DashboardPageHeader
          badge="Workspace Intelligence"
          title="Analytics"
          description="Track AI usage, document activity, team access, and conversation intelligence with real workspace data."
        />

        <button
          type="button"
          onClick={() => loadAnalytics({ silentConversationRefresh: true })}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Refreshing..." : "Refresh"}
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
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="AI Generations" value={formatNumber(overview.totalGenerations)} icon={Bot} description="Generated AI outputs" />
            <MetricCard title="Documents" value={formatNumber(overview.totalDocuments)} icon={FileText} description="Uploaded workspace files" />
            <MetricCard title="Document Chats" value={formatNumber(overview.totalChats)} icon={MessageSquareText} description="Questions answered" />
            <MetricCard title="Team Members" value={formatNumber(overview.totalTeamMembers)} icon={Users} description={`${overview.activeTeamMembers} active users`} />
            <MetricCard title="Total Requests" value={formatNumber(overview.totalRequests)} icon={Activity} description="AI + document chat" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <Card className="p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Last 7 Days</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Workspace Usage Trend</h2>
                </div>
                <BarChart3 className="text-cyan-300" size={24} />
              </div>

              <div className="flex h-72 items-end gap-4 overflow-x-auto border-b border-white/10 pb-4">
                {weeklyUsage.map((item) => {
                  const height = Math.max(
                    Math.round((Number(item.count) / maxWeeklyCount) * 100),
                    Number(item.count) > 0 ? 12 : 4
                  );

                  return (
                    <div key={item.label} className="flex min-w-[38px] flex-1 flex-col items-center gap-3">
                      <div className="flex h-56 w-full items-end rounded-full bg-white/[0.03] p-1">
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-cyan-200 shadow-lg shadow-cyan-500/20"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className="text-xs text-slate-400">{formatNumber(item.count)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-400">Total Requests</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(overview.totalRequests)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Success Rate</p>
                  <p className="mt-1 text-2xl font-semibold text-white">98.4%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avg. Response</p>
                  <p className="mt-1 text-2xl font-semibold text-white">1.2s</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Live Workspace Events</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Recent Activity</h2>
              </div>

              {recentActivities.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p className="text-sm text-slate-400">No recent activity yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {recentActivities.map((activity, index) => {
                    const Icon = iconMap[activity.type] || Activity;
                    return (
                      <div key={`${activity.title}-${index}`} className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-cyan-300">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-white">{activity.title}</p>
                            <span className="shrink-0 text-xs text-slate-500">{formatActivityTime(activity.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-400">{activity.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-cyan-300">10.13D</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Conversation Intelligence</h2>
                <p className="mt-1 text-sm text-slate-500">A dedicated view of chat volume, engagement, activity patterns, and conversation depth.</p>
              </div>
              {isRefreshingConversations && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} /> Updating conversation data
                </div>
              )}
            </div>

            {conversationError && (
              <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                {conversationError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ConversationMetric title="Conversations" value={formatNumber(conversationOverview.totalConversations)} description={`${formatNumber(conversationOverview.activeConversations)} active`} icon={MessageSquareText} />
              <ConversationMetric title="Messages" value={formatNumber(conversationOverview.totalMessages)} description={`${formatNumber(conversationActivity.messagesLast7Days)} in the last 7 days`} icon={Hash} />
              <ConversationMetric title="Active Rate" value={`${conversationHealth.activeRate}%`} description="Active conversations vs total" icon={Activity} />
              <ConversationMetric title="Avg. Depth" value={conversationHealth.messagesPerConversation.toFixed(1)} description="Messages per conversation" icon={BarChart3} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ConversationMetric title="Created · 24h" value={formatNumber(conversationActivity.conversationsCreatedLast24Hours)} description="New conversations" icon={Sparkles} />
              <ConversationMetric title="Created · 7d" value={formatNumber(conversationActivity.conversationsCreatedLast7Days)} description="New conversations" icon={Clock3} />
              <ConversationMetric title="AI Messages" value={formatNumber(conversationOverview.assistantMessages)} description={`${formatRatio(conversationAverages.userToAssistantRatio)} user-to-AI`} icon={Bot} />
              <ConversationMetric title="Characters" value={formatNumber(conversationOverview.totalCharacters)} description={`${formatNumber(conversationAverages.averageCharactersPerMessage)} average per message`} icon={Hash} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Conversation Averages</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Engagement Profile</h3>
                  </div>
                  <Activity className="text-cyan-300" size={22} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs text-slate-500">Avg. messages / conversation</p>
                    <p className="mt-2 text-xl font-semibold text-white">{Number(conversationAverages.averageMessagesPerConversation || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs text-slate-500">Avg. characters / message</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatNumber(conversationAverages.averageCharactersPerMessage)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs text-slate-500">Avg. conversation duration</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatMinutes(conversationAverages.averageConversationDurationMinutes)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs text-slate-500">Message frequency</p>
                    <p className="mt-2 text-xl font-semibold text-white">{Number(conversationAverages.messageFrequencyPerHour || 0).toFixed(2)}/hr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-5">
                  <p className="text-sm text-slate-400">Conversation Lifecycle</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Workspace State</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <span className="text-sm text-slate-400">Active</span>
                    <span className="text-sm font-semibold text-white">{formatNumber(conversationOverview.activeConversations)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <span className="text-sm text-slate-400">Archived</span>
                    <span className="text-sm font-semibold text-white">{formatNumber(conversationOverview.archivedConversations)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <span className="text-sm text-slate-400">Pinned</span>
                    <span className="text-sm font-semibold text-white">{formatNumber(conversationOverview.pinnedConversations)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <span className="text-sm text-slate-400">Messages · 24h</span>
                    <span className="text-sm font-semibold text-white">{formatNumber(conversationActivity.messagesLast24Hours)}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <ConversationTimeline timeline={conversationTimeline} />
              <TopConversations conversations={topConversations} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <BreakdownCard title="Generation Types" subtitle="AI Usage Breakdown" items={analytics?.generationTypes || []} />
              <BreakdownCard title="Document Categories" subtitle="File Upload Breakdown" items={analytics?.documentCategories || []} />
              <BreakdownCard title="Team Roles" subtitle="Workspace Access Breakdown" items={analytics?.teamRoles || []} />
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Conversation analytics generated from the workspace data. Latest message: {formatDate(conversationAnalytics?.generatedAt)}.
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
