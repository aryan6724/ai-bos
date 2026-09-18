import {
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import { useWorkspace } from "../../store/WorkspaceContext";

export default function MessageActions({ message }) {
  const { regenerateResponse } = useWorkspace();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleLike = () => {
    console.log("Liked:", message.id);
  };

  const handleDislike = () => {
    console.log("Disliked:", message.id);
  };

  return (
    <div className="mt-4 flex items-center gap-3 opacity-0 transition group-hover:opacity-100">

      {/* Copy */}
      <button
        onClick={handleCopy}
        title="Copy"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300"
      >
        <Copy size={16} />
      </button>

      {/* Regenerate */}
      <button
        onClick={regenerateResponse}
        title="Regenerate"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300"
      >
        <RotateCcw size={16} />
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        title="Like"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-green-400"
      >
        <ThumbsUp size={16} />
      </button>

      {/* Dislike */}
      <button
        onClick={handleDislike}
        title="Dislike"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-red-400"
      >
        <ThumbsDown size={16} />
      </button>

    </div>
  );
}