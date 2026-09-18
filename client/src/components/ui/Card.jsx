import { cn } from "../../utils/cn";

export default function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl",
        hover && "transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}