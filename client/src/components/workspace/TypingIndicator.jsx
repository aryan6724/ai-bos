import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
        <Bot size={20} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"></span>
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
            style={{ animationDelay: "150ms" }}
          ></span>
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
            style={{ animationDelay: "300ms" }}
          ></span>
        </div>
      </div>
    </div>
  );
}