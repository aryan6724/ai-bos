import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content }) {
  if (!content) {
    return (
      <p className="text-sm leading-7 text-slate-500">
        Your generated document will appear here after you click Generate.
      </p>
    );
  }

  return (
    <div className="space-y-5 text-sm leading-7 text-slate-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-cyan-100">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="leading-7 text-slate-300">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="ml-5 list-disc space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-5 list-decimal space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7 text-slate-300">{children}</li>
          ),
          hr: () => <hr className="border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}