import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
  togglePinConversation,
  archiveConversation,
} from "../services/chatService";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  const abortControllerRef = useRef(null);

  
 // ----------------------------------------
// Generate AI Response (Streaming + Conversation Memory)
// ----------------------------------------
const generateAIResponse = async (conversationMessages) => {
  setLoading(true);

  const aiMessageId = crypto.randomUUID();

  // Add empty assistant message
  setMessages((prev) => [
    ...prev,
    {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      streaming: true,
    },
  ]);

  abortControllerRef.current = new AbortController();

  try {
    // Clean conversation before sending to backend
const payload = conversationMessages
  .filter(
    (msg) =>
      (msg.role === "user" || msg.role === "assistant") &&
      msg.content?.trim()
  )
  .map((msg) => ({
    role: msg.role,
    content: msg.content.trim(),
  }));

await streamChat(
  {
    conversationId,
    messages: payload,
  },
  abortControllerRef.current.signal,
  {
    onConversation: (id) => {
  setConversationId(id);
  loadConversations();
},

    onChunk: (chunk) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: msg.content + chunk,
              }
            : msg
        )
      );
    },

    onDone: async () => {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === aiMessageId
        ? {
            ...msg,
            streaming: false,
          }
        : msg
    )
  );

  await loadConversations();
}
  }
);
  } catch (error) {
    // Ignore abort errors
    if (error.name === "AbortError") {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                streaming: false,
              }
            : msg
        )
      );

      return;
    }

    console.error("Streaming Error:", error);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMessageId
          ? {
              ...msg,
              content: "❌ Failed to communicate with AI server.",
              streaming: false,
            }
          : msg
      )
    );
  } finally {
    abortControllerRef.current = null;
    setLoading(false);
  }
};

// 👇 YAHAN ADD KARO
const loadConversations = async () => {
  try {
    const data = await getConversations();

    setConversations(data.conversations || []);
  } catch (error) {
    console.error(error);
  }
};

const loadConversation = async (id) => {
  try {
    const data = await getConversationMessages(id);

    setConversationId(id);

   setMessages(
  data.messages.map((msg) => ({
    id: msg._id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.createdAt),
  }))
);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
   loadConversations();
}, []);

// ----------------------------------------
// Send Message
// ----------------------------------------
const sendMessage = async (text) => {
  if (!text.trim() || loading) return;

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: text.trim(),
    timestamp: new Date(),
  };

  let updatedMessages = [];

  // Update state and keep latest conversation
  setMessages((prev) => {
    updatedMessages = [...prev, userMessage];
    return updatedMessages;
  });

  // Wait for React state update
  await Promise.resolve();

  // Generate AI response using latest conversation
  await generateAIResponse(updatedMessages);
};
  // ----------------------------------------
  // Stop Generation
  // ----------------------------------------
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.streaming
          ? {
              ...msg,
              streaming: false,
            }
          : msg
      )
    );

    setLoading(false);
  };

  // ----------------------------------------
// Regenerate Response
// ----------------------------------------
const regenerateResponse = async () => {
  stopGeneration();

  let conversation = [];

  setMessages((prev) => {
    const updated = [...prev];

    // Remove last assistant response
    for (let i = updated.length - 1; i >= 0; i--) {
      if (updated[i].role === "assistant") {
        updated.splice(i, 1);
        break;
      }
    }

    conversation = updated.filter(
      (msg) =>
        (msg.role === "user" || msg.role === "assistant") &&
        msg.content?.trim()
    );

    return updated;
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  if (conversation.length > 0) {
    await generateAIResponse(conversation);
  }
};

// ----------------------------------------
// New Chat
// ----------------------------------------
const newConversation = () => {
  stopGeneration();

  setConversationId(null);
  setMessages([]);
};

// ----------------------------------------
// Rename Conversation
// ----------------------------------------
const renameChat = async (id, title) => {
  try {
    await renameConversation(id, title);
    await loadConversations();
  } catch (error) {
    console.error(error);
  }
};

// ----------------------------------------
// Pin / Unpin Conversation
// ----------------------------------------
const pinConversation = async (id) => {
  try {
    await togglePinConversation(id);

    // Sidebar refresh
    await loadConversations();
  } catch (error) {
    console.error(error);
  }
};

const archiveChat = async (id) => {
  try {
    await archiveConversation(id);

    // Agar current chat archive hui hai
    if (conversationId === id) {
      newConversation();
    }

    // Sidebar refresh
    await loadConversations();
  } catch (error) {
    console.error(error);
  }
};

const removeConversation = async (id) => {
  try {
    await deleteConversation(id);

    if (conversationId === id) {
      newConversation();
    }

    await loadConversations();
  } catch (error) {
    console.error(error);
  }
};

return (
  <WorkspaceContext.Provider
    value={{
      messages,
      setMessages,

      loading,

      conversationId,
      setConversationId,

      conversations,
      loadConversations,
      loadConversation,

      newConversation,

      sendMessage,
      stopGeneration,
      regenerateResponse,

      draftMessage,
      setDraftMessage,

      renameChat,
      pinConversation,
      archiveChat,
      removeConversation,
    }}
  >
    {children}
  </WorkspaceContext.Provider>
);
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}