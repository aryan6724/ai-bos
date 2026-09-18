import { useEffect, useRef, useState } from "react";

export default function RenameDialog({
  open,
  initialValue,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState(initialValue || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle(initialValue || "");

      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">
          Rename Conversation
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Enter a new conversation title.
        </p>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(title.trim());
            }

            if (e.key === "Escape") {
              onClose();
            }
          }}
          className="mt-5 w-full rounded-xl border border-slate-700 bg-[#0B1220] px-4 py-3 text-white outline-none focus:border-cyan-500"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-2 text-white hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(title.trim())}
            className="rounded-xl bg-cyan-500 px-5 py-2 font-medium text-slate-900 hover:bg-cyan-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}