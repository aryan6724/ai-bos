export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto mb-12 max-w-3xl text-center"
          : "mb-10 max-w-2xl"
      }
    >
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}