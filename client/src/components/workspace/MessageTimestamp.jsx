export default function MessageTimestamp({ timestamp }) {
  const formatted = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <p className="mt-2 text-xs text-slate-500">
      {formatted}
    </p>
  );
}