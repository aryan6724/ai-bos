import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/20 hover:bg-cyan-300",
  secondary:
    "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
  ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-400",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  as: Component = "button",
  ...props
}) {
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}