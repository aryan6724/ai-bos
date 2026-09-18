import {
  MessageSquare,
  FileText,
  Mail,
  BookOpen,
  FileBarChart,
  Settings,
} from "lucide-react";

const items = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    active: true,
  },
  {
    icon: FileText,
    title: "Documents",
  },
  {
    icon: Mail,
    title: "Email",
  },
  {
    icon: FileBarChart,
    title: "Reports",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
  },
  {
    icon: Settings,
    title: "Settings",
  },
];

export default function WorkspaceSidebar() {
  return (
    <aside className="flex h-full flex-col rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

      {/* Title */}

      <div className="mb-6">

        <h3 className="text-xl font-semibold text-white">
          AI Tools
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Enterprise Workspace
        </p>

      </div>

      {/* Navigation */}

      <nav className="space-y-2">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              className={`group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                item.active
                  ? "bg-cyan-500 text-slate-900 shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />

              <span className="text-sm font-medium">
                {item.title}
              </span>
            </button>
          );
        })}

      </nav>

      {/* Footer */}

      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">

        <p className="text-xs uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <p className="mt-2 text-sm font-medium text-white">
          AI-BOS Enterprise
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Premium AI Workspace
        </p>

      </div>

    </aside>
  );
}