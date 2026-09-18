import { cn } from "../../utils/cn";

const variants = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-200",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
};

export default function Badge({ children, variant = "cyan", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-4 py-2 text-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}