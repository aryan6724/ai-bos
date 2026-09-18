import { Sparkles } from "lucide-react";

import { useWorkspace } from "../../store/WorkspaceContext";
import Conversation from "./Conversation";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
  const { messages, loading } = useWorkspace();

  return (
    <div className="flex h-full flex-col bg-[#0B1220]">

      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0B1220] px-8">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20">
            <Sparkles size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              AI Conversation
            </h2>

            <p className="text-xs text-slate-400">
              Enterprise AI Assistant
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ● Connected
          </span>

          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            GPT-4.1
          </span>

        </div>

      </div>

      {/* Conversation + Input */}
      <div className="flex min-h-0 flex-1 flex-col">

        {/* Scrollable Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Conversation
            messages={messages}
            loading={loading}
          />
        </div>

        {/* Sticky Input */}
        <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-[#09090B]/90 px-8 py-6 backdrop-blur-xl">

          <div className="mx-auto w-full max-w-5xl">

            <ChatInput />

          </div>

        </div>

      </div>

    </div>
  );
}