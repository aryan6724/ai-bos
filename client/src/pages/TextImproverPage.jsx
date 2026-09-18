import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";
import { improveText } from "../services/aiService";

const modes = [
  {
    value: "improve",
    label: "Improve Writing",
    description: "Make the writing stronger and more natural.",
  },
  {
    value: "grammar",
    label: "Fix Grammar",
    description: "Correct grammar, spelling, and punctuation.",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Make it polished and workplace-ready.",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Make it warmer and more approachable.",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Reduce unnecessary words while keeping meaning.",
  },
  {
    value: "clear",
    label: "Clear & Natural",
    description: "Make the message easier to understand.",
  },
];

const tones = ["professional", "friendly", "formal", "simple", "business"];

const MAX_LENGTH = 20000;

export default function TextImproverPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("improve");
  const [tone, setTone] = useState("professional");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const selectedMode = useMemo(
    () => modes.find((item) => item.value === mode) || modes[0],
    [mode]
  );

  const handleImprove = async (event) => {
    event?.preventDefault();

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Please enter some text first.");
      return;
    }

    if (trimmed.length > MAX_LENGTH) {
      setError(`Text cannot exceed ${MAX_LENGTH.toLocaleString()} characters.`);
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setIsCopied(false);

      const data = await improveText({
        text: trimmed,
        mode,
        tone,
      });

      setOutput(data?.result?.output || "");
    } catch (err) {
      console.error(
        "Text improvement failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Text improvement failed. Please check the AI provider and try again."
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
      setError("Unable to copy the result. Please copy it manually.");
    }
  };

  const handleClear = () => {
    setText("");
    setOutput("");
    setError("");
    setIsCopied(false);
  };

  const handleUseResult = () => {
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
          title="Text Improver"
          description="Improve, rewrite, and polish your text while preserving the original meaning."
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
              <p className="text-sm text-slate-400">1. Enter your text</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Original Text
              </h2>
            </div>

            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
              <Sparkles size={20} />
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError("");
            }}
            placeholder="Paste an email, message, paragraph, report section, or any text you want to improve..."
            maxLength={MAX_LENGTH}
            className="min-h-[320px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40"
          />

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>{text.length.toLocaleString()} characters</span>
            <span>Maximum {MAX_LENGTH.toLocaleString()}</span>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-white">
              2. Choose improvement
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {modes.map((item) => {
                const active = item.value === mode;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-400/40 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">
                        {item.label}
                      </span>

                      {active && (
                        <Check size={16} className="text-cyan-300" />
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="text-improver-tone"
              className="mb-2 block text-sm font-medium text-white"
            >
              Tone
            </label>

            <select
              id="text-improver-tone"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              {tones.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleImprove}
              disabled={isProcessing || !text.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Improve Text
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing && !text}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser size={17} />
              Clear
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-600">
            Selected: {selectedMode.label}. AI-BOS will preserve the original
            meaning and will not invent facts.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">3. AI result</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Improved Text
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {output && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                  >
                    {isCopied ? <Check size={15} /> : <Copy size={15} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={handleUseResult}
                    className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/15"
                  >
                    <RefreshCw size={15} />
                    Use as Input
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="min-h-[520px] rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            {isProcessing ? (
              <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
                <Loader2 size={34} className="animate-spin text-cyan-300" />
                <p className="mt-4 text-sm font-medium text-white">
                  AI is improving your text...
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Please wait while the selected writing mode is applied.
                </p>
              </div>
            ) : output ? (
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                {output}
              </div>
            ) : (
              <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                  <Wand2 size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  Your improved text will appear here
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Enter your text, choose an improvement mode, and run the AI
                  tool.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
