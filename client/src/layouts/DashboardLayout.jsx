import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  Users,
  Wand2,
  X,
} from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../store/AuthContext";
import useNotifications from "../hooks/useNotifications";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "../services/notificationService";

const sidebarLinks = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "AI Tools",
    to: "/dashboard/ai-tools",
    icon: Sparkles,
  },
  {
    label: "AI Generator",
    to: "/dashboard/ai-generator",
    icon: Wand2,
  },
  {
    label: "Documents",
    to: "/dashboard/documents",
    icon: FileText,
  },
  {
    label: "Doc Chat",
    to: "/dashboard/document-chat",
    icon: MessageSquareText,
  },

  {
  label: "Conversations",
  to: "/dashboard/conversations",
  icon: MessageSquareText,
},

  {
    label: "Uploads",
    to: "/dashboard/uploads",
    icon: UploadCloud,
  },
  {
    label: "Team",
    to: "/dashboard/team",
    icon: Users,
  },
  {
    label: "Analytics",
    to: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
  label: "Audit Logs",
  to: "/dashboard/audit-logs",
  icon: ClipboardList,
  },
  {
  label: "Notifications",
  to: "/dashboard/notifications",
  icon: Bell,
},
  {
    label: "Billing",
    to: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    label: "Profile",
    to: "/dashboard/profile",
    icon: User,
  },
  {
    label: "Admin",
    to: "/dashboard/admin",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

const searchItems = [
  {
    title: "Dashboard Overview",
    description: "View workspace overview and live analytics.",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "AI Tools",
    description: "Open all AI-BOS tools from one command center.",
    to: "/dashboard/ai-tools",
    icon: Sparkles,
  },
  {
    title: "AI Generator",
    description: "Generate resumes, emails, reports, and business content.",
    to: "/dashboard/ai-generator",
    icon: Wand2,
  },
  {
    title: "Documents",
    description: "Manage uploaded documents.",
    to: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Document Chat",
    description: "Ask questions from uploaded documents.",
    to: "/dashboard/document-chat",
    icon: MessageSquareText,
  },
  {
    title: "Uploads",
    description: "Upload files to AI-BOS document vault.",
    to: "/dashboard/uploads",
    icon: UploadCloud,
  },
  {
    title: "Team",
    description: "Manage workspace users and roles.",
    to: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Analytics",
    description: "Track AI usage and workspace activity.",
    to: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Billing",
    description: "View subscription and usage plan.",
    to: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Profile",
    description: "Manage account settings and password.",
    to: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Admin",
    description: "Open secured admin control center.",
    to: "/dashboard/admin",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
  title: "Audit Logs",
  description: "View all workspace activities and security audit logs.",
  to: "/dashboard/audit-logs",
  icon: ClipboardList,
  roles: ["admin"],
},

{
  title: "Conversations",
  description:
    "Manage your AI conversations and continue previous chats.",
  to: "/dashboard/conversations",
  icon: MessageSquareText,
},
];

function SidebarContent({ user, onNavigate }) {
  const visibleLinks = sidebarLinks.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <>
      <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30">
          <Brain size={24} />
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">AI-BOS</h1>
          <p className="text-xs text-slate-400">Business Operating System</p>
        </div>
      </Link>

      <div className="mt-8 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <p className="text-sm font-medium text-cyan-100">Current Plan</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Premium workspace for {user?.companyName || "AI-BOS Workspace"}.
        </p>

        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-2 w-[68%] rounded-full bg-cyan-300" />
        </div>

        <p className="mt-2 text-xs text-slate-500">68% monthly AI usage</p>
      </div>

      <nav className="mt-8 space-y-2">
        {visibleLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
    const { unread } = useNotifications();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

async function loadNotifications() {
  try {
    const data = await getNotifications();
    setNotifications(data.notifications || []);
  } catch (error) {
    console.error("Failed to load notifications:", error);
  }
}

async function handleRead(id) {
  try {
    await markAsRead(id);
    await loadNotifications();
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

async function handleDelete(id) {
  try {
    await deleteNotification(id);
    await loadNotifications();
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
}

useEffect(() => {
  loadNotifications();
}, []);

  const workspaceName = user?.companyName || "AI-BOS Workspace";
  const avatarInitial =
    user?.avatarInitial || user?.fullName?.charAt(0)?.toUpperCase() || "A";

  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const allowedItems = searchItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role);
    });

    if (!query) {
      return allowedItems.slice(0, 6);
    }

    return allowedItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearchNavigate = (path) => {
    setSearchQuery("");
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-2xl lg:flex">
  <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
    <SidebarContent user={user} />
  </div>

  <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
    >
      <LogOut size={19} />
      Logout
    </button>
  </div>
</aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close sidebar overlay"
          />

          <aside className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-hidden border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
  <div className="mb-6 flex shrink-0 items-center justify-between">
    <p className="text-sm font-medium text-slate-400">Menu</p>

    <button
      type="button"
      onClick={() => setMobileSidebarOpen(false)}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300"
    >
      <X size={20} />
    </button>
  </div>

  <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
    <SidebarContent
      user={user}
      onNavigate={() => setMobileSidebarOpen(false)}
    />
  </div>

  <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
    >
      <LogOut size={19} />
      Logout
    </button>
  </div>
</aside>

        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-sm text-slate-400">Workspace</p>
                <h2 className="text-xl font-semibold tracking-tight">
                  {workspaceName}
                </h2>
              </div>
            </div>

            <div className="relative hidden max-w-md flex-1 md:block">
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Search size={18} className="text-slate-500" />

                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="Search tools, documents, users..."
                  className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              {searchOpen && (
                <div className="absolute left-0 right-0 top-14 z-50 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Quick Search
                    </p>

                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  {filteredSearchItems.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                      No matching result found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSearchItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.title}
                            type="button"
                            onClick={() => handleSearchNavigate(item.to)}
                            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.05]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                              <Icon size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-white">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowNotifications((current) => !current)}
                   className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                   >
                 <Bell size={19} />
                 {unread > 0 && (
                 <span
                 className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                 >
                 {unread > 99 ? "99+" : unread}
                 </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationDropdown
                     notifications={notifications}
                     onRead={handleRead}
                     onDelete={handleDelete}
                  />
                 )}
              </div>

              <Link
                to="/dashboard/profile"
                className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white sm:flex"
              >
                <Settings size={19} />
              </Link>

              <Link
                to="/dashboard/billing"
                className="hidden items-center justify-center rounded-2xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 sm:inline-flex"
                aria-label="Open billing and upgrade"
              >
                Upgrade
              </Link>

              <Link
                to="/dashboard/profile"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-sm font-bold text-slate-950"
              >
                {avatarInitial}
              </Link>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </main>
  );
}