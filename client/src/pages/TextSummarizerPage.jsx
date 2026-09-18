import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  FileText,
  Loader2,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";
import { summarizeText } from "../services/aiService";

const modes = [
  {
    value: "quick",
    label: "Quick Summary",
    description: "Capture only the most important information.",
  },
  {
    value: "detailed",
    label: "Detailed Summary",
    description: "Keep important facts, context, and conclusions.",
  },
  {
    value: "bullets",
    label: "Bullet Points",
    description: "Turn the content into clear, concise points.",
  },
  {
    value: "key-takeaways",
    label: "Key Takeaways",
    description: "Extract the most important insights and findings.",
  },
  {
    value: "action-items",
    label: "Action Items",
    description: "Extract explicitly stated tasks and next steps.",
  },
  {
    value: "executive",
    label: "Executive Summary",
    description: "Create a business-focused leadership summary.",
  },
];

const tones = ["professional", "simple", "formal", "friendly", "business"];
const MAX_LENGTH = 30000;

export default function TextSummarizerPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("quick");
  const [tone, setTone] = useState("professional");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const selectedMode = useMemo(
    () => modes.find((item) => item.value === mode) || modes[0],
    [mode]
  );

  const handleSummarize = async (event) => {
    event?.preventDefault();

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Please enter some text first.");
      return;
    }

    if (trimmed.length > MAX_LENGTH) {
      setError(
        `Text cannot exceed ${MAX_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setIsCopied(false);

      const data = await summarizeText({
        text: trimmed,
        mode,
        tone,
      });

      const nextOutput = data?.result?.output || "";

      if (!nextOutput) {
        throw new Error("Empty summary received");
      }

      setOutput(nextOutput);
    } catch (err) {
      console.error(
        "Text summarization failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Text summarization failed. Please check the AI provider and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 1800);
    } catch {
      setError("Unable to copy the summary. Please copy it manually.");
    }
  };

  const handleClear = () => {
    setText("");
    setOutput("");
    setError("");
    setIsCopied(false);
  };

  const handleUseSummary = () => {
    if (!output) return;

    setText(output);
    setOutput("");
    setIsCopied(false);
    setError("");
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          to="/dashboard/ai-tools"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to AI Tools
        </Link>

        <DashboardPageHeader
          badge="AI Productivity Tool"
          title="Text Summarizer"
          description="Turn long text into clear summaries, key takeaways, bullet points, and actionable insights."
        />
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">1. Enter your content</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Source Text
              </h2>
            </div>

            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
              <FileText size={20} />
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError("");
            }}
            placeholder="Paste an article, report, meeting notes, email, project update, or any long text you want to summarize..."
            rows={13}
            maxLength={MAX_LENGTH}
            className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
          />

          <div className="mt-2 flex justify-between text-[11px] text-slate-600">
            <span>{text.length.toLocaleString()} characters</span>
            <span>Maximum {MAX_LENGTH.toLocaleString()}</span>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center gap-2">
              <Target size={17} className="text-cyan-300" />
              <h3 className="text-sm font-semibold text-white">
                2. Choose summary style
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {modes.map((item) => {
                const selected = mode === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setMode(item.value);
                      setError("");
                    }}
                    disabled={isProcessing}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-400/60 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    } ${isProcessing ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-white">
                        {item.label}
                      </span>

                      {selected && (
                        <Check size={17} className="shrink-0 text-cyan-300" />
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Tone
            </span>

            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              disabled={isProcessing}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {tones.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleSummarize}
              disabled={isProcessing || !text.trim()}
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles size={19} />
                  Summarize Text
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser size={18} />
              Clear
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-600">
            Selected: {selectedMode.label}. AI-BOS summarizes only the
            information contained in your source text.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-slate-400">3. AI result</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Summary
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output || isProcessing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? "Copied" : "Copy"}
              </button>

              <button
                type="button"
                onClick={handleUseSummary}
                disabled={!output || isProcessing}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ListChecks size={16} />
                Use as Input
              </button>
            </div>
          </div>

          <div className="premium-scrollbar min-h-[480px] max-h-[680px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-5 sm:p-6">
            {isProcessing ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                  <Loader2
                    size={38}
                    className="mx-auto animate-spin text-cyan-300"
                  />
                  <p className="mt-4 text-sm text-slate-400">
                    AI-BOS is analyzing your text...
                  </p>
                </div>
              </div>
            ) : output ? (
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                {output}
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                    <Sparkles size={25} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-white">
                    Your summary will appear here
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Paste your content, choose a summary style, and let AI-BOS
                    extract the information that matters most.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
