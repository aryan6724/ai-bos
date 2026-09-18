import api from "./api";

// ==========================================
// Normal Chat
// ==========================================
export const chatWithAI = async ({
  conversationId,
  messages,
}) => {
  const { data } = await api.post("/ai/chat", {
    conversationId,
    messages,
  });

  return data;
};

// ==========================================
// Streaming Chat (SSE)
// ==========================================
export const streamChat = async (
  { conversationId, messages },
  signal,
  handlers
) => {
  const token = localStorage.getItem("ai_bos_token");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/ai/chat/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId,
        messages,
      }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error("Streaming request failed.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");

      let eventName = "";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.replace("event:", "").trim();
        }

        if (line.startsWith("data:")) {
          data += line.replace("data:", "").trim();
        }
      }

      switch (eventName) {
        case "conversation":
          try {
            const json = JSON.parse(data);

            handlers?.onConversation?.(
              json.conversationId
            );
          } catch (err) {
            console.error(err);
          }
          break;

        case "chunk":
          handlers?.onChunk?.(data);
          break;

        case "done":
          handlers?.onDone?.();
          break;

        default:
          break;
      }
    }
  }
};

export const getConversations = async () => {
  const { data } = await api.get("/conversations");

  return data;
};

export const getConversationMessages = async (conversationId) => {
  const { data } = await api.get(`/conversations/${conversationId}`);
  return data;
};

export const renameConversation = async (conversationId, title) => {
  const { data } = await api.patch(`/conversations/${conversationId}`, {
    title,
  });

  return data;
};

export const deleteConversation = async (id) => {
  const { data } = await api.delete(`/conversations/${id}`);
  return data;
};

export const archiveConversation = async (id) => {
  const { data } = await api.patch(`/conversations/${id}/archive`);
  return data;
};

export const togglePinConversation = async (id) => {
  const { data } = await api.patch(`/conversations/${id}/pin`);
  return data;
};