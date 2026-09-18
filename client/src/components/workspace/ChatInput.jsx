import { useEffect, useState } from "react";
import {
  Paperclip,
  Mic,
  SendHorizontal,
  Square,
} from "lucide-react";

import { useWorkspace } from "../../store/WorkspaceContext";

export default function ChatInput() {
  const [text, setText] = useState("");

  const {
  sendMessage,
  loading,
  stopGeneration,
  draftMessage,
  setDraftMessage,
} = useWorkspace();

useEffect(() => {
  if (draftMessage) {
    setText(draftMessage);
    setDraftMessage("");
  }
}, [draftMessage, setDraftMessage]);

  const handleSend = () => {
    if (!text.trim()) return;

    sendMessage(text);

    setText("");
  };

  return (
    <div className="rounded-3xl border border-slate-700 bg-[#111827] shadow-xl">

      {/* Text Area */}

      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !loading
          ) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ask AI anything..."
        className="max-h-48 min-h-[60px] w-full resize-none bg-transparent px-6 pt-5 text-[15px] leading-7 text-white outline-none placeholder:text-slate-500"
      />

      {/* Bottom Toolbar */}

      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">

        {/* Left */}

        <div className="flex items-center gap-2">

          <button
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Attach File"
          >
            <Paperclip size={18} />
          </button>

          <button
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Voice"
          >
            <Mic size={18} />
          </button>

        </div>

        {/* Right */}

        {loading ? (
          <button
            onClick={stopGeneration}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-white transition hover:bg-red-600"
          >
            <Square
              size={16}
              fill="currentColor"
            />

            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal size={18} />

            Send
          </button>
        )}

      </div>

    </div>
  );
}