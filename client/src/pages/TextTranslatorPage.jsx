import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Clipboard,
  Languages,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { translateText } from "../services/aiService";

const languages = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Chinese",
  "Korean",
  "Arabic",
  "Russian",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Urdu",
];

const tones = [
  { value: "natural", label: "Natural" },
  { value: "professional", label: "Professional" },
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "simple", label: "Simple" },
];

const MAX_LENGTH = 20000;

export default function TextTranslatorPage() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [tone, setTone] = useState("natural");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const remainingCharacters = MAX_LENGTH - text.length;

  const sourceOptions = useMemo(() => {
    return [
      { value: "auto", label: "Auto Detect" },
      ...languages.map((language) => ({
        value: language,
        label: language,
      })),
    ];
  }, []);

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to translate.");
      return;
    }

    if (text.trim().length > MAX_LENGTH) {
      setError("Text cannot exceed 20,000 characters.");
      return;
    }

    if (
      sourceLanguage !== "auto" &&
      sourceLanguage === targetLanguage
    ) {
      setError("Source and target languages should be different.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCopied(false);

      const response = await translateText({
        text: text.trim(),
        sourceLanguage,
        targetLanguage,
        tone,
      });

      const translatedText =
        response?.result?.output ||
        response?.output ||
        "";

      if (!translatedText.trim()) {
        throw new Error("Translation returned an empty result.");
      }

      setOutput(translatedText.trim());
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to translate the text. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === "auto") {
      setError(
        "Select a source language before swapping languages."
      );
      return;
    }

    const previousSource = sourceLanguage;

    setSourceLanguage(targetLanguage);
    setTargetLanguage(previousSource);
    setError("");
  };

  const handleCopy = async () => {
    if (!output.trim()) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Unable to copy the translated text.");
    }
  };

  const handleUseAsInput = () => {
    if (!output.trim()) return;

    setText(output);
    setOutput("");
    setCopied(false);
    setError("");
  };

  const handleClear = () => {
    setText("");
    setOutput("");
    setError("");
    setCopied(false);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-600">
              <Sparkles size={16} />
              AI Writing Tool
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Text Translator
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
              Translate your text into multiple languages while
              preserving its original meaning, details, and tone.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Languages size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Character Limit
              </p>
              <p className="text-sm font-semibold text-slate-800">
                20,000 characters
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Language Controls */}
          <div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
              {/* Source */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From
                </label>

                <select
                  value={sourceLanguage}
                  onChange={(e) => {
                    setSourceLanguage(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {sourceOptions.map((language) => (
                    <option
                      key={language.value}
                      value={language.value}
                    >
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap */}
              <button
                type="button"
                onClick={handleSwapLanguages}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 lg:w-auto"
                title="Swap languages"
              >
                <ArrowLeftRight size={17} />
                <span className="lg:hidden">
                  Swap Languages
                </span>
              </button>

              {/* Target */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  To
                </label>

                <select
                  value={targetLanguage}
                  onChange={(e) => {
                    setTargetLanguage(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Translation Tone
              </label>

              <div className="flex flex-wrap gap-2">
                {tones.map((item) => {
                  const active = tone === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTone(item.value)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-violet-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="grid lg:grid-cols-2">
            {/* Input */}
            <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Original Text
                  </p>
                  <p className="text-xs text-slate-400">
                    Enter the text you want to translate
                  </p>
                </div>

                <span
                  className={`text-xs font-medium ${
                    remainingCharacters < 1000
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  {text.length.toLocaleString()} /{" "}
                  {MAX_LENGTH.toLocaleString()}
                </span>
              </div>

              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                placeholder="Type or paste your text here..."
                className="min-h-[320px] w-full resize-none border-0 bg-white p-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-300 sm:p-5"
                maxLength={MAX_LENGTH}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Translated Text
                  </p>
                  <p className="text-xs text-slate-400">
                    Your translated result will appear here
                  </p>
                </div>

                {output && (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                    Ready
                  </span>
                )}
              </div>

              <div className="min-h-[320px] bg-slate-50/60 p-4 sm:p-5">
                {loading ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                      <Loader2
                        size={26}
                        className="animate-spin"
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      Translating your text...
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      AI-BOS is preparing your translation.
                    </p>
                  </div>
                ) : output ? (
                  <div className="min-h-[280px] whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {output}
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                      <Languages size={26} />
                    </div>

                    <p className="text-sm font-medium text-slate-500">
                      Translation will appear here
                    </p>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                      Enter your text, choose the target language,
                      and click Translate Text.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3 sm:px-5">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              {output && !loading && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Clipboard size={16} />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleUseAsInput}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                  >
                    <RotateCcw size={16} />
                    Use as Input
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleTranslate}
                disabled={loading || !text.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages size={17} />
                    Translate Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Languages size={19} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Multilingual
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Translate between a wide range of commonly used
              languages.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles size={19} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Meaning Preserved
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Important names, dates, numbers, and details are
              preserved during translation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ArrowLeftRight size={19} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Flexible Tone
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose natural, professional, formal, friendly, or
              simple translation styles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}