import MessageTimestamp from "./MessageTimestamp";

export default function UserMessage({ message }) {
  return (
    <div className="flex justify-end">

      <div className="max-w-4xl">

        <div className="mb-2 flex items-center justify-end gap-2">

          <MessageTimestamp timestamp={message.timestamp} />

          <span className="text-sm font-medium text-slate-400">
            You
          </span>

        </div>

        <div className="rounded-3xl bg-cyan-500 px-6 py-4 text-slate-950 shadow-md">

          <p className="whitespace-pre-wrap text-[15px] leading-7">
            {message.content}
          </p>

        </div>

      </div>

    </div>
  );
}