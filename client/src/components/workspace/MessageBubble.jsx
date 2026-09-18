import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

export default function MessageBubble({ message }) {
  if (!message) return null;

  switch (message.role) {
    case "user":
      return <UserMessage message={message} />;

    case "assistant":
      return <AssistantMessage message={message} />;

    default:
      return null;
  }
}