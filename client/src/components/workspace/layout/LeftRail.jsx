import {
  MessageSquare,
  FileText,
  FileBarChart,
  BookOpen,
  Settings,
  PanelLeftClose,
} from "lucide-react";

const items = [
  {
    icon: MessageSquare,
    label: "AI Chat",
    active: true,
  },
  {
    icon: FileText,
    label: "Documents",
  },
  {
    icon: FileBarChart,
    label: "Reports",
  },
  {
    icon: BookOpen,
    label: "Knowledge",
  },
  {
    icon: Settings,
    label: "Settings",
  },
];

export default function LeftRail() {
  return (
    <aside className="flex h-full w-[72px] flex-col items-center border-r border-slate-800 bg-[#09090B] py-5">

      {/* Logo */}

      <button
        className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-slate-900 shadow-lg transition hover:scale-105"
      >
        <PanelLeftClose size={22} />
      </button>

      {/* Navigation */}

      <nav className="flex flex-1 flex-col items-center gap-3">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              title={item.label}
              className={`group flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
                item.active
                  ? "bg-cyan-500 text-slate-900 shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}

      </nav>

      {/* Footer */}

      <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-white">
        A
      </div>

    </aside>
  );
}