import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CodeBlock({
  inline,
  className,
  children,
  ...props
}) {
  const [copied, setCopied] = useState(false);

  const code = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code
        className="rounded-md bg-slate-800 px-1.5 py-1 font-mono text-sm text-cyan-300"
        {...props}
      >
        {children}
      </code>
    );
  }

  const language =
    className?.replace("language-", "") || "text";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-slate-700 bg-[#0B1220] shadow-xl">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-slate-700 bg-[#111827] px-5 py-3">

        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {language}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy
            </>
          )}
        </button>

      </div>

      {/* Code */}

      <pre className="overflow-x-auto bg-[#020817] px-6 py-5 text-[14px] leading-7">
        <code
          className={className}
          {...props}
        >
          {children}
        </code>
      </pre>

    </div>
  );
}