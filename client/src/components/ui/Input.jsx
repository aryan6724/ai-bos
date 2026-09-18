import { cn } from "../../utils/cn";

export default function Input({
  label,
  error,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-300">
          {label}
        </span>
      )}

      <input
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-400/10",
          error && "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/10",
          inputClassName
        )}
        {...props}
      />

      {error && <span className="mt-2 block text-sm text-rose-300">{error}</span>}
    </label>
  );
}