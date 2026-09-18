import { Bot } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import MessageActions from "./MessageActions";
import MessageTimestamp from "./MessageTimestamp";

export default function AssistantMessage({ message }) {
  return (
    <div className="flex items-start gap-5">

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-900 shadow-md">

        <Bot size={20} />

      </div>

      {/* Content */}
      <div className="flex-1">

        {/* Header */}
        <div className="mb-3 flex items-center gap-3">

          <h4 className="font-semibold text-white">
            AI Assistant
          </h4>

          <MessageTimestamp
            timestamp={message.timestamp}
          />

        </div>

        {/* Message */}
        <div className="max-w-none text-[16px] leading-8 text-slate-200">

          <MarkdownRenderer
            content={message.content}
          />

          {message.streaming && (
            <span className="ml-1 animate-pulse font-bold text-cyan-400">
              ▍
            </span>
          )}

        </div>

        {/* Footer Actions */}

        {!message.streaming && (

          <div className="mt-5">

            <MessageActions />

          </div>

        )}

      </div>

    </div>
  );
}