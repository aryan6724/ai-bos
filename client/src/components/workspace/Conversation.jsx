import { useEffect, useMemo, useRef } from "react";

import WelcomeScreen from "./WelcomeScreen";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function Conversation({
  messages = [],
  loading = false,
}) {
  const bottomRef = useRef(null);

  // Hide system messages
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages]
  );

  // Auto scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [visibleMessages.length, loading]);

  // Empty conversation
  if (visibleMessages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 py-8">

      {visibleMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
        />
      ))}

      {loading && <TypingIndicator />}

      <div
        ref={bottomRef}
        className="h-6"
      />

    </div>
  );
}