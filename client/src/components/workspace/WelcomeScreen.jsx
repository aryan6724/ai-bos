import {
  Sparkles,
  FileText,
  Mail,
  BarChart3,
} from "lucide-react";

const cards = [
  {
    icon: Sparkles,
    title: "Generate Proposal",
    desc: "Create professional business proposals."
  },
  {
    icon: FileText,
    title: "Summarize PDF",
    desc: "Upload and summarize documents."
  },
  {
    icon: Mail,
    title: "Write Email",
    desc: "Generate professional emails."
  },
  {
    icon: BarChart3,
    title: "Business Report",
    desc: "Create AI-powered reports."
  }
];

export default function WelcomeScreen() {
  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-10">

      <h1 className="mb-4 text-5xl font-bold text-white">
        Welcome to AI-BOS
      </h1>

      <p className="mb-14 max-w-3xl text-center text-lg text-slate-400">
        Your Enterprise AI Workspace for documents,
        reports, emails and intelligent conversations.
      </p>

      <div className="grid w-full gap-6 md:grid-cols-2">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-left transition hover:border-cyan-500 hover:bg-slate-900"
            >
              <Icon
                size={30}
                className="mb-5 text-cyan-400"
              />

              <h3 className="mb-2 text-xl font-semibold text-white">
                {card.title}
              </h3>

              <p className="text-slate-400">
                {card.desc}
              </p>

            </button>
          );
        })}

      </div>

    </div>
  );
}