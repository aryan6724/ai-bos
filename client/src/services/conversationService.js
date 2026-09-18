import api from "./api";

const getToken = () =>
  localStorage.getItem("ai_bos_token");

const getErrorMessage = async (
  response,
  fallbackMessage
) => {
  try {
    const data = await response.json();
    return data?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

// ======================================================
// BASIC CONVERSATION API
// ======================================================

export const createConversation = async () => {
  const response = await api.post("/conversations");
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get("/conversations");
  return response.data;
};

export const getArchivedConversations = async () => {
  const response = await api.get("/conversations/archived");
  return response.data;
};

export const getConversationStats = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.get(
    `/conversations/${conversationId}/stats`
  );

  return response.data;
};

export const getConversationMessages = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data;
};

export const renameConversation = async (
  conversationId,
  title
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const cleanTitle =
    typeof title === "string" ? title.trim() : "";

  if (!cleanTitle) {
    throw new Error("Conversation title is required.");
  }

  const response = await api.patch(
    `/conversations/${conversationId}`,
    { title: cleanTitle }
  );

  return response.data;
};

export const togglePinConversation = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.patch(
    `/conversations/${conversationId}/pin`
  );

  return response.data;
};

export const archiveConversation = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.patch(
    `/conversations/${conversationId}/archive`
  );

  return response.data;
};

export const unarchiveConversation = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.patch(
    `/conversations/${conversationId}/unarchive`
  );

  return response.data;
};

export const deleteConversation = async (
  conversationId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const response = await api.delete(
    `/conversations/${conversationId}`
  );

  return response.data;
};

// ======================================================
// NORMAL NON-STREAMING CHAT
// ======================================================

export const sendConversationMessage = async ({
  conversationId,
  messages,
}) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array.");
  }

  const response = await api.post("/ai/chat", {
    conversationId,
    messages,
  });

  return response.data;
};

// ======================================================
// SSE PARSER
// ======================================================

const parseSSE = async (
  response,
  {
    onChunk,
    onConversation,
    onError,
  } = {}
) => {
  if (!response?.body) {
    throw new Error(
      "Streaming is not supported by this browser."
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const processEvent = (rawEvent) => {
    const event = rawEvent.trim();

    if (!event) return;

    let eventName = "message";
    let eventData = "";

    for (const rawLine of event.split(/\r?\n/)) {
      if (rawLine.startsWith("event:")) {
        eventName = rawLine
          .slice(6)
          .trim();
      } else if (rawLine.startsWith("data:")) {
        const dataPart = rawLine
          .slice(5)
          .trim();

        eventData += dataPart;
      }
    }

    if (!eventData) return;

    if (eventName === "conversation") {
      try {
        const data = JSON.parse(eventData);

        onConversation?.(
          data?.conversationId
        );
      } catch (error) {
        console.error(
          "Conversation SSE parse error:",
          error
        );
      }

      return;
    }

    if (eventName === "chunk") {
      // The backend sends each chunk as JSON-stringified text.
      // Fall back to raw text for compatibility.
      let chunk = eventData;

      try {
        const parsed = JSON.parse(eventData);

        if (typeof parsed === "string") {
          chunk = parsed;
        } else if (
          typeof parsed?.chunk === "string"
        ) {
          chunk = parsed.chunk;
        } else if (
          typeof parsed?.content === "string"
        ) {
          chunk = parsed.content;
        }
      } catch {
        // Raw text chunk is valid for the existing backend.
      }

      if (chunk) {
        onChunk?.(chunk);
      }

      return;
    }

    if (eventName === "error") {
      let message = "AI streaming failed.";

      try {
        const data = JSON.parse(eventData);
        message =
          data?.message ||
          data?.error ||
          message;
      } catch {
        if (eventData) {
          message = eventData;
        }
      }

      onError?.(message);
    }
  };

  while (true) {
    const { value, done } =
      await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split(
      /\r?\n\r?\n/
    );

    buffer = events.pop() || "";

    for (const event of events) {
      processEvent(event);
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    processEvent(buffer);
  }
};

// ======================================================
// STREAM CHAT
// ======================================================

export const streamConversationMessage = async ({
  conversationId,
  messages,
  onChunk,
  onConversation,
}) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array.");
  }

  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    "http://localhost:5000/api/ai/chat/stream",
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
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to start AI stream."
      )
    );
  }

  let streamError = "";

  await parseSSE(response, {
    onChunk,
    onConversation,
    onError: (message) => {
      streamError = message;
    },
  });

  if (streamError) {
    throw new Error(streamError);
  }
};

// ======================================================
// SAFE REGENERATION
// ======================================================

export const regenerateConversationMessageStream =
  async ({
    conversationId,
    messageId,
    messages,
    onChunk,
  }) => {
    if (!conversationId) {
      throw new Error(
        "Conversation ID is required."
      );
    }

    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    if (!Array.isArray(messages)) {
      throw new Error(
        "Messages must be an array."
      );
    }

    const token = getToken();

    if (!token) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const response = await fetch(
      "http://localhost:5000/api/ai/chat/stream/regenerate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          messages,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Failed to regenerate AI response."
        )
      );
    }

    let streamError = "";

    await parseSSE(response, {
      onChunk,
      onError: (message) => {
        streamError = message;
      },
    });

    if (streamError) {
      throw new Error(streamError);
    }
  };
