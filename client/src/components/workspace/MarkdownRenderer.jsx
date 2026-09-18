import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import CodeBlock from "./CodeBlock";

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code(props) {
          return <CodeBlock {...props} />;
        },

        h1: ({ children }) => (
          <h1 className="mb-6 mt-8 text-3xl font-bold text-white">
            {children}
          </h1>
        ),

        h2: ({ children }) => (
          <h2 className="mb-5 mt-7 text-2xl font-semibold text-white">
            {children}
          </h2>
        ),

        h3: ({ children }) => (
          <h3 className="mb-4 mt-6 text-xl font-semibold text-white">
            {children}
          </h3>
        ),

        p: ({ children }) => (
          <p className="mb-5 whitespace-pre-wrap leading-8 text-slate-300">
            {children}
          </p>
        ),

        ul: ({ children }) => (
          <ul className="mb-5 list-disc space-y-2 pl-6 text-slate-300">
            {children}
          </ul>
        ),

        ol: ({ children }) => (
          <ol className="mb-5 list-decimal space-y-2 pl-6 text-slate-300">
            {children}
          </ol>
        ),

        li: ({ children }) => (
          <li className="leading-8">
            {children}
          </li>
        ),

        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-cyan-500 pl-4 italic text-slate-400">
            {children}
          </blockquote>
        ),

        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        ),

        thead: ({ children }) => (
          <thead className="bg-slate-800">
            {children}
          </thead>
        ),

        th: ({ children }) => (
          <th className="border border-slate-700 px-4 py-3 text-left font-semibold text-white">
            {children}
          </th>
        ),

        td: ({ children }) => (
          <td className="border border-slate-700 px-4 py-3 text-slate-300">
            {children}
          </td>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 underline transition hover:text-cyan-300"
          >
            {children}
          </a>
        ),

        hr: () => (
          <hr className="my-8 border-slate-700" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}