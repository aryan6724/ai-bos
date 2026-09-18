import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Archive,
  Check,
  Copy,
  RotateCcw,
  Edit3,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pin,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  BarChart3,
  Clock3,
  Hash,
  UserRound,
  Bot,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";

import {
  createConversation,
  getConversations,
  getConversationMessages,
  getConversationStats,
  renameConversation,
  togglePinConversation,
  archiveConversation,
  getArchivedConversations,
  unarchiveConversation,
  deleteConversation,
  streamConversationMessage,
  regenerateConversationMessageStream,
} from "../services/conversationService";


// ======================================================
// HELPERS
// ======================================================

const formatDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = now.getTime() - parsed.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}d ago`;
  }

  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


const getConversationGroup = (date) => {
  if (!date) return "Older";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Older";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  const startOfSevenDaysAgo = new Date(startOfToday);
  startOfSevenDaysAgo.setDate(startOfToday.getDate() - 7);

  if (parsed >= startOfToday) return "Today";
  if (parsed >= startOfYesterday) return "Yesterday";
  if (parsed >= startOfSevenDaysAgo) return "Previous 7 days";
  return "Older";
};

const conversationGroupOrder = [
  "Today",
  "Yesterday",
  "Previous 7 days",
  "Older",
];

const getConversationIdFromUrl = () => {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search).get(
    "conversationId"
  ) || "";
};

const setConversationIdInUrl = (conversationId, mode = "replace") => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (conversationId) {
    url.searchParams.set("conversationId", conversationId);
  } else {
    url.searchParams.delete("conversationId");
  }

  if (mode === "push") {
    window.history.pushState(window.history.state, "", url.toString());
  } else {
    window.history.replaceState(
      window.history.state,
      "",
      url.toString()
    );
  }
};


// ======================================================
// MESSAGE BUBBLE
// ======================================================

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  copied,
  regenerating,
  disabled,
}) {
  const isUser = message?.role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-3xl px-5 py-4 ${
          isUser
            ? "rounded-br-md bg-cyan-400 text-slate-950"
            : "rounded-bl-md border border-white/10 bg-white/[0.045] text-slate-200"
        }`}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">
          {isUser ? "You" : "AI Assistant"}
        </div>

        <div className="text-sm leading-7">
  <p className="whitespace-pre-wrap">
    {message?.content || ""}
  </p>

  {message?.isStreaming && (
    <span className="mt-2 inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  )}
</div>

        <div
          className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
            isUser
              ? "text-slate-900/50"
              : "text-slate-600"
          }`}
        >
          <span>{formatDate(message?.createdAt)}</span>

          {!isUser && !message?.isStreaming && message?.content && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onCopy?.(message)}
                className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
                title="Copy response"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={() => onRegenerate?.(message)}
                disabled={
                  disabled ||
                  message?.isRegenerating ||
                  regenerating
                }
                className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                title="Regenerate response"
              >
                <RotateCcw
                  size={12}
                  className={regenerating ? "animate-spin" : ""}
                />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ======================================================
// CONVERSATION ROW
// ======================================================

function ConversationRow({
  conversation,
  selected,
  onSelect,
  onRename,
  onPin,
  onArchive,
  onUnarchive,
  onDelete,
  disabled,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group relative rounded-2xl border p-3 transition ${
        selected
          ? "border-cyan-400/20 bg-cyan-400/[0.08]"
          : "border-white/5 bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.035]"
      }`}
    >
      {selected && (
        <span
          className="absolute left-0 top-4 h-8 w-0.5 rounded-r-full bg-cyan-300"
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        aria-current={selected ? "page" : undefined}
        onClick={() => {
          if (disabled) return;
          onSelect(conversation);
        }}
        disabled={disabled}
        className="w-full text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              selected
                ? "bg-cyan-400/15 text-cyan-300"
                : "bg-white/[0.05] text-slate-400"
            }`}
          >
            <MessageSquare size={17} />
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {conversation?.title || "New Chat"}
              </p>

              {conversation?.pinned && (
                <Pin
                  size={12}
                  className="shrink-0 text-cyan-300"
                />
              )}
            </div>

            <p className="mt-1 truncate text-xs text-slate-600">
              {conversation?.lastMessage ||
                "No messages yet"}
            </p>

            <p className="mt-2 text-[10px] text-slate-700">
              {formatDate(conversation?.updatedAt)}
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setShowMenu((current) => !current);
        }}
        disabled={disabled}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Conversation options"
      >
        <MoreVertical size={16} />
      </button>

      {showMenu && (
        <div className="absolute right-3 top-12 z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onRename(conversation);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Edit3 size={14} />
            Rename
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onPin(conversation);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Pin size={14} />
            {conversation?.pinned
              ? "Unpin"
              : "Pin"}
          </button>

          {conversation?.archived ? (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onUnarchive(conversation);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Archive size={14} />
              Unarchive
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onArchive(conversation);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Archive size={14} />
              Archive
            </button>
          )}

          <div className="my-1 border-t border-white/5" />

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onDelete(conversation);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-rose-300 transition hover:bg-rose-400/10"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}


// ======================================================
// PAGE
// ======================================================

export default function ConversationsPage() {
  const [conversations, setConversations] =
    useState([]);

  const [archivedConversations, setArchivedConversations] =
    useState([]);

  const [showArchived, setShowArchived] =
    useState(false);

  const [isLoadingArchived, setIsLoadingArchived] =
    useState(false);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] = useState("");

  const [messageInput, setMessageInput] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const messageInputRef = useRef(null);

  const [editingConversation, setEditingConversation] =
    useState(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [isRenaming, setIsRenaming] =
    useState(false);

  const [actionId, setActionId] =
    useState(null);

  const [isStreaming, setIsStreaming] =
    useState(false);

  const [copiedMessageId, setCopiedMessageId] =
    useState(null);

  const [regeneratingMessageId, setRegeneratingMessageId] =
    useState(null);

  const [conversationStats, setConversationStats] =
    useState(null);

  const [isLoadingStats, setIsLoadingStats] =
    useState(false);

  // Prevent stale message requests from overwriting a newly selected chat.
  const messageLoadRequestRef = useRef(0);

  const MAX_MESSAGE_LENGTH = 4000;

  // Preserve the requested chat from the URL across the initial load.
  const initialConversationIdRef = useRef(
    getConversationIdFromUrl()
  );

  // ====================================================
  // LOAD CONVERSATIONS
  // ====================================================

const loadConversations = async () => {
  try {
    setIsLoading(true);
    setError("");

    const response = await getConversations();
    const items = Array.isArray(response?.conversations)
      ? response.conversations
      : [];

    setConversations(items);

    const requestedId = initialConversationIdRef.current;
    const requestedConversation = requestedId
      ? items.find((item) => item._id === requestedId)
      : null;

    if (requestedConversation) {
      initialConversationIdRef.current = "";
      setSelectedConversation(requestedConversation);
      return;
    }

    initialConversationIdRef.current = "";

    if (selectedConversation?._id) {
      const current = items.find(
        (item) => item._id === selectedConversation._id
      );

      if (current) {
        setSelectedConversation(current);
      } else {
        setSelectedConversation(items[0] || null);
        setMessages([]);
      }
    } else if (items.length > 0) {
      setSelectedConversation(items[0]);
    }
  } catch (err) {
    console.error("Failed to load conversations:", err);
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load conversations."
    );
  } finally {
    setIsLoading(false);
  }
};


  
const refreshConversationList = async () => {
  try {
    const response = await getConversations();
    const items = Array.isArray(response?.conversations)
      ? response.conversations
      : [];

    setConversations(items);

    if (selectedConversation?._id) {
      const current = items.find(
        (item) => item._id === selectedConversation._id
      );

      if (current) {
        setSelectedConversation(current);
      } else {
        setSelectedConversation(items[0] || null);
        setMessages([]);
      }
    }

    return items;
  } catch (error) {
    console.error("Failed to refresh conversations:", error);
    return [];
  }
};


// ====================================================
// LOAD ARCHIVED CONVERSATIONS
// ====================================================

const loadArchivedConversations = async () => {
  try {
    setIsLoadingArchived(true);
    setError("");

    const response = await getArchivedConversations();

    const items = Array.isArray(response?.conversations)
      ? response.conversations
      : [];

    setArchivedConversations(items);

    return items;
  } catch (err) {
    console.error(
      "Failed to load archived conversations:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load archived conversations."
    );

    setArchivedConversations([]);

    return [];
  } finally {
    setIsLoadingArchived(false);
  }
};


  // ====================================================
  // LOAD MESSAGES
  // ====================================================

  const loadMessages = async (conversation) => {
    if (!conversation?._id) {
      setMessages([]);
      return;
    }

    const requestId = ++messageLoadRequestRef.current;

    try {
      setIsLoadingMessages(true);
      setError("");

      const response = await getConversationMessages(
        conversation._id
      );

      if (requestId !== messageLoadRequestRef.current) return;

      setSelectedConversation(
        response?.conversation || conversation
      );

      setMessages(
        Array.isArray(response?.messages)
          ? response.messages
          : []
      );
    } catch (err) {
      if (requestId !== messageLoadRequestRef.current) return;

      console.error(
        "Failed to load conversation messages:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load conversation."
      );
      setMessages([]);
    } finally {
      if (requestId === messageLoadRequestRef.current) {
        setIsLoadingMessages(false);
      }
    }
  };


  // ====================================================
  // LOAD CONVERSATION STATS
  // ====================================================

  const loadConversationStats = async (conversationId) => {
    if (!conversationId) {
      setConversationStats(null);
      return;
    }

    try {
      setIsLoadingStats(true);

      const response = await getConversationStats(
        conversationId
      );

      setConversationStats(
        response?.stats || null
      );
    } catch (err) {
      console.error(
        "Failed to load conversation statistics:",
        err
      );
      setConversationStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadConversations();
  }, []);

  // Keep the active conversation addressable and restorable.
  useEffect(() => {
    const selectedId = selectedConversation?._id || "";
    const currentUrlId = getConversationIdFromUrl();

    if (currentUrlId !== selectedId) {
      setConversationIdInUrl(selectedId);
    }
  }, [selectedConversation?._id]);

  // Support browser back/forward navigation between conversation URLs.
  useEffect(() => {
    const handlePopState = () => {
      if (isSending || isStreaming || isLoadingMessages || actionId) {
        return;
      }

      const conversationId = getConversationIdFromUrl();

      if (!conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      const conversation = conversations.find(
        (item) => item._id === conversationId
      );

      if (conversation) {
        setError("");
        setSelectedConversation(conversation);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    conversations,
    isSending,
    isStreaming,
    isLoadingMessages,
    actionId,
  ]);


  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (editingConversation) {
        setEditingConversation(null);
        return;
      }

      if (deleteTarget) {
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [editingConversation, deleteTarget]);

  useEffect(() => {
    const textarea = messageInputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > 128 ? "auto" : "hidden";
  }, [messageInput]);

  // ====================================================
  // SELECT CONVERSATION
  // ====================================================

  useEffect(() => {
    if (selectedConversation?._id) {
      loadMessages(selectedConversation);
      loadConversationStats(selectedConversation._id);
    } else {
      setConversationStats(null);
    }
  }, [selectedConversation?._id]);

  // ====================================================
  // AUTO SCROLL
  // ====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  // ====================================================
  // COPY MESSAGE
  // ====================================================

  const handleCopyMessage = async (message) => {
    if (!message?.content) return;

    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message._id);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message._id ? null : current
        );
      }, 1500);
    } catch (err) {
      console.error("Copy message error:", err);
      setError("Unable to copy the AI response.");
    }
  };

  // ====================================================
  // REGENERATE
  // ====================================================

  const handleRegenerateMessage = async (message) => {
    if (
      !message?._id ||
      message?.role !== "assistant" ||
      !selectedConversation?._id ||
      selectedConversation?.archived ||
      isSending ||
      isStreaming ||
      isLoadingMessages
    ) {
      return;
    }

    const messageIndex = messages.findIndex(
      (item) => item._id === message._id
    );

    if (messageIndex <= 0) return;

    const previousUserMessage = [...messages]
      .slice(0, messageIndex)
      .reverse()
      .find((item) => item.role === "user");

    if (!previousUserMessage?.content?.trim()) return;

    const requestMessages = messages
      .slice(0, messageIndex)
      .filter(
        (item) =>
          item.role === "user" ||
          item.role === "assistant" ||
          item.role === "system"
      )
      .map((item) => ({
        role: item.role,
        content: item.content || "",
      }))
      .filter((item) => item.content.trim());

    const originalContent = message.content || "";
    const conversationId = selectedConversation._id;

    try {
      setRegeneratingMessageId(message._id);
      setIsSending(true);
      setIsStreaming(true);
      setError("");

      setMessages((current) =>
        current.map((item) =>
          item._id === message._id
            ? {
                ...item,
                content: "",
                isStreaming: true,
                isRegenerating: true,
              }
            : item
        )
      );

      let streamedResponse = "";

      await regenerateConversationMessageStream({
        conversationId,
        messageId: message._id,
        messages: requestMessages,
        onChunk: (chunk) => {
          streamedResponse += chunk;

          setMessages((current) =>
            current.map((item) =>
              item._id === message._id
                ? {
                    ...item,
                    content: streamedResponse,
                    isStreaming: true,
                    isRegenerating: true,
                  }
                : item
            )
          );
        },
      });

      if (!streamedResponse.trim()) {
        throw new Error(
          "The AI returned an empty response. Please try regenerating again."
        );
      }

      const refreshed = await getConversationMessages(
        conversationId
      );

      setSelectedConversation(
        refreshed?.conversation || selectedConversation
      );

      setMessages(
        Array.isArray(refreshed?.messages)
          ? refreshed.messages
          : []
      );

      await refreshConversationList();
      await loadConversationStats(conversationId);
    } catch (err) {
      console.error("Regenerate AI error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to regenerate AI response."
      );

      setMessages((current) =>
        current.map((item) =>
          item._id === message._id
            ? {
                ...item,
                content: originalContent,
                isStreaming: false,
                isRegenerating: false,
              }
            : item
        )
      );
    } finally {
      setRegeneratingMessageId(null);
      setIsSending(false);
      setIsStreaming(false);
    }
  };


  // ====================================================
  // SEARCH
  // ====================================================

  const filteredConversations =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          conversation?.title
            ?.toLowerCase()
            .includes(query) ||
          conversation?.lastMessage
            ?.toLowerCase()
            .includes(query)
      );
    }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    return conversationGroupOrder
      .map((label) => ({
        label,
        items: filteredConversations.filter(
          (conversation) =>
            getConversationGroup(conversation?.updatedAt) === label
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredConversations]);


  const filteredArchivedConversations =
    useMemo(() => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return archivedConversations;

      return archivedConversations.filter(
        (conversation) =>
          conversation?.title?.toLowerCase().includes(query) ||
          conversation?.lastMessage?.toLowerCase().includes(query)
      );
    }, [archivedConversations, searchQuery]);

  const groupedArchivedConversations = useMemo(() => {
    return conversationGroupOrder
      .map((label) => ({
        label,
        items: filteredArchivedConversations.filter(
          (conversation) =>
            getConversationGroup(conversation?.updatedAt) === label
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredArchivedConversations]);


  // ====================================================
  // CREATE
  // ====================================================

  const handleCreateConversation =
    async () => {
      if (
        isSending ||
        isStreaming ||
        isCreating ||
        isLoadingMessages ||
        actionId
      ) {
        return;
      }

      try {
        setIsCreating(true);
        setError("");

        const response =
          await createConversation();

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to create conversation."
          );
        }

        const conversation =
          response.conversation;

        setConversations((current) => [
          conversation,
          ...current,
        ]);

        if (
          getConversationIdFromUrl() !== conversation?._id
        ) {
          setConversationIdInUrl(
            conversation?._id || "",
            "push"
          );
        }

        setSelectedConversation(
          conversation
        );

        setMessages([]);
      } catch (err) {
        console.error(
          "Create conversation error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to create conversation."
        );
      } finally {
        setIsCreating(false);
      }
    };


  // ====================================================
  // RENAME
  // ====================================================

const handleRename = async () => {
  const title = editTitle.trim();

  if (!editingConversation?._id) {
    return;
  }

  if (!title) {
    return;
  }

  try {
    setIsRenaming(true);
    setError("");

    const response =
      await renameConversation(
        editingConversation._id,
        title
      );

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to rename conversation."
      );
    }

    const updated =
      response.conversation;

    setConversations((current) =>
      current.map((item) =>
        item._id === updated._id
          ? updated
          : item
      )
    );

    if (
      selectedConversation?._id ===
      updated._id
    ) {
      setSelectedConversation(updated);
    }

    setEditingConversation(null);
    setEditTitle("");

    // ========================================
    // REFRESH FROM BACKEND
    // ========================================

    await refreshConversationList();

  } catch (err) {
    console.error(
      "Rename conversation error:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to rename conversation."
    );
  } finally {
    setIsRenaming(false);
  }
};

  // ====================================================
  // PIN
  // ====================================================

const handlePin = async (
  conversation
) => {
  try {
    setActionId(conversation._id);

    const response =
      await togglePinConversation(
        conversation._id
      );

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to update pin."
      );
    }

    const updated =
      response.conversation;

    setConversations((current) =>
      current.map((item) =>
        item._id === updated._id
          ? updated
          : item
      )
    );

    if (
      selectedConversation?._id ===
      updated._id
    ) {
      setSelectedConversation(updated);
    }

    // ========================================
    // REFRESH FROM BACKEND
    // ========================================

    await refreshConversationList();

  } catch (err) {
    console.error(
      "Pin conversation error:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to update pin."
    );
  } finally {
    setActionId(null);
  }
};


  // ====================================================
  // ARCHIVE
  // ====================================================

const handleArchive = async (
  conversation
) => {
  try {
    setActionId(conversation._id);
    setError("");

    const response =
      await archiveConversation(
        conversation._id
      );

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to archive conversation."
      );
    }

    setConversations((current) =>
      current.filter(
        (item) =>
          item._id !== conversation._id
      )
    );

    if (
      selectedConversation?._id ===
      conversation._id
    ) {
      setSelectedConversation(null);
      setMessages([]);
    }

    // ========================================
    // REFRESH FROM BACKEND
    // ========================================

    await refreshConversationList();

    if (showArchived) {
      await loadArchivedConversations();
    }

  } catch (err) {
    console.error(
      "Archive conversation error:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to archive conversation."
    );
  } finally {
    setActionId(null);
  }
};


  // ====================================================
  // UNARCHIVE
  // ====================================================

  const handleUnarchive = async (conversation) => {
    if (!conversation?._id || actionId) return;

    try {
      setActionId(conversation._id);
      setError("");

      const response = await unarchiveConversation(
        conversation._id
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to unarchive conversation."
        );
      }

      const restored = response.conversation;

      setArchivedConversations((current) =>
        current.filter((item) => item._id !== conversation._id)
      );

      setConversations((current) => [
        restored,
        ...current,
      ]);
    } catch (err) {
      console.error(
        "Unarchive conversation error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to unarchive conversation."
      );
    } finally {
      setActionId(null);
    }
  };


  // ====================================================
  // DELETE
  // ====================================================

 const handleDelete = async (
    conversation
  ) => {
    if (
      !conversation?._id ||
      isSending ||
      isStreaming ||
      isLoadingMessages ||
      actionId
    ) {
      return;
    }

    setDeleteTarget(conversation);
  };

  const confirmDeleteConversation = async () => {
    const conversation = deleteTarget;

    if (!conversation?._id || actionId) {
      return;
    }

    try {
      setActionId(conversation._id);
      setError("");

      const response =
        await deleteConversation(
          conversation._id
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to delete conversation."
        );
      }

      const remaining =
        conversations.filter(
          (item) =>
            item._id !== conversation._id
        );

      setConversations(remaining);

      if (
        selectedConversation?._id ===
        conversation._id
      ) {
        const nextConversation =
          remaining[0] || null;

        setSelectedConversation(nextConversation);
        setMessages([]);

        setConversationIdInUrl(
          nextConversation?._id || "",
          "replace"
        );
      }

      await refreshConversationList();
      setDeleteTarget(null);
    } catch (err) {
      console.error(
        "Delete conversation error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete conversation."
      );
    } finally {
      setActionId(null);
    }
  };

  // ====================================================
  // SEND MESSAGE
  // ====================================================

  const handleSendMessage = async () => {
   const content = messageInput.trim();

   if (!content) return;

   if (
     !selectedConversation?._id ||
     selectedConversation?.archived
   ) {
     setError(
       "Please create or select an active conversation first."
     );
     return;
   }

   if (
     isSending ||
     isStreaming ||
     isLoadingMessages ||
     isCreating
   ) {
     return;
   }

   const conversationId = selectedConversation._id;
   const previousInput = messageInput;

   const userMessage = {
     role: "user",
     content,
   };

   const updatedMessages = [
     ...messages
       .filter(
         (item) =>
           item.role === "user" ||
           item.role === "assistant" ||
           item.role === "system"
       )
       .map((item) => ({
         role: item.role,
         content: item.content || "",
       }))
       .filter((item) => item.content.trim()),
     userMessage,
   ];

   const temporaryUserId = `temp-user-${Date.now()}`;
   const temporaryAssistantId = `temp-assistant-${Date.now()}`;

   try {
     setIsSending(true);
     setIsStreaming(true);
     setError("");

     setMessages((current) => [
       ...current,
       {
         _id: temporaryUserId,
         conversation: conversationId,
         role: "user",
         content,
         createdAt: new Date().toISOString(),
       },
       {
         _id: temporaryAssistantId,
         conversation: conversationId,
         role: "assistant",
         content: "",
         createdAt: new Date().toISOString(),
         isStreaming: true,
       },
     ]);

     setMessageInput("");

     let streamedResponse = "";

     await streamConversationMessage({
       conversationId,
       messages: updatedMessages,
       onConversation: (returnedConversationId) => {
         if (
           returnedConversationId &&
           returnedConversationId !== conversationId
         ) {
           console.warn(
             "Unexpected conversation id from stream:",
             returnedConversationId
           );
         }
       },
       onChunk: (chunk) => {
         streamedResponse += chunk;

         setMessages((current) =>
           current.map((message) =>
             message._id === temporaryAssistantId
               ? {
                   ...message,
                   content: streamedResponse,
                   isStreaming: true,
                 }
               : message
           )
         );
       },
     });

     if (!streamedResponse.trim()) {
       throw new Error(
         "The AI returned an empty response. Please try sending your message again."
       );
     }

     const refreshed = await getConversationMessages(
       conversationId
     );

     if (refreshed?.conversation) {
       setSelectedConversation(refreshed.conversation);
     }

     setMessages(
       Array.isArray(refreshed?.messages)
         ? refreshed.messages
         : []
     );

     await refreshConversationList();
     await loadConversationStats(conversationId);
   } catch (err) {
     console.error("Streaming AI error:", err);

     setError(
       err?.response?.data?.message ||
         err?.message ||
         "Failed to generate AI response."
     );

     setMessageInput((current) =>
       current.trim() ? current : previousInput
     );

     setMessages((current) =>
       current.filter(
         (message) =>
           message._id !== temporaryUserId &&
           message._id !== temporaryAssistantId
       )
     );
   } finally {
     setIsSending(false);
     setIsStreaming(false);
   }
 };


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* HEADER */}

        <DashboardPageHeader
          badge="AI Workspace"
          title="Conversations"
          description="Manage your AI conversations, continue previous chats, and organize your workspace."
        />

        {/* ERROR */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-sm text-rose-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-300/70 transition hover:text-rose-200"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* WORKSPACE */}

        <div className="grid min-h-[680px] gap-6 xl:grid-cols-[360px_1fr]">

          {/* SIDEBAR */}

          <Card className="flex min-h-[680px] flex-col overflow-hidden p-0">

            <div className="border-b border-white/10 p-5">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                    AI Workspace
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Your Conversations
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !showArchived;
                      setShowArchived(next);
                      setSearchQuery("");

                      if (next) {
                        await loadArchivedConversations();
                      }
                    }}
                    disabled={isLoadingArchived || isCreating || Boolean(actionId)}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                      showArchived
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={showArchived ? "Show active conversations" : "Show archived conversations"}
                  >
                    {isLoadingArchived ? "Loading..." : showArchived ? "Active" : "Archived"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateConversation}
                    disabled={isCreating || showArchived}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    title="New conversation"
                  >
                    {isCreating ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </div>

              </div>

              {/* SEARCH */}

              <div className="relative mt-5">

                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-cyan-400/20 focus:bg-white/[0.04]"
                />

              </div>

            </div>

            {/* LIST */}

            <div className="flex-1 overflow-y-auto p-3">

              {showArchived ? (
                isLoadingArchived ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                      <Loader2
                        size={26}
                        className="animate-spin text-cyan-300"
                      />
                      Loading archived conversations...
                    </div>
                  </div>
                ) : filteredArchivedConversations.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-600">
                      <Archive size={24} />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-400">
                      No archived conversations
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Archived conversations will appear here and can be restored anytime.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groupedArchivedConversations.map((group) => (
                      <section key={group.label}>
                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                          {group.label}
                        </p>
                        <div className="space-y-2">
                          {group.items.map((conversation) => (
                            <ConversationRow
                              key={conversation._id}
                              conversation={conversation}
                              selected={false}
                              onSelect={() => {}}
                              onRename={() => {}}
                              onPin={() => {}}
                              onArchive={() => {}}
                              onUnarchive={handleUnarchive}
                              onDelete={handleDelete}
                              disabled={Boolean(actionId)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )
              ) : isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                    <Loader2
                      size={26}
                      className="animate-spin text-cyan-300"
                    />
                    Loading conversations...
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-600">
                    <MessageSquare size={24} />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-400">
                    No conversations found
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Start a new conversation to build your AI workspace.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateConversation}
                    disabled={isCreating}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                  >
                    <Plus size={15} />
                    New Conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedConversations.map((group) => (
                    <section key={group.label}>
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((conversation) => (
                          <ConversationRow
                            key={conversation._id}
                            conversation={conversation}
                            selected={selectedConversation?._id === conversation._id}
                            onSelect={(conversation) => {
                              if (isSending || isStreaming || isLoadingMessages || actionId) return;
                              setError("");
                              if (getConversationIdFromUrl() !== conversation._id) {
                                setConversationIdInUrl(conversation._id, "push");
                              }
                              setSelectedConversation(conversation);
                            }}
                            onRename={(item) => {
                              setEditingConversation(item);
                              setEditTitle(item.title || "");
                            }}
                            onPin={handlePin}
                            onArchive={handleArchive}
                            onUnarchive={handleUnarchive}
                            onDelete={handleDelete}
                            disabled={
                              isSending ||
                              isStreaming ||
                              isLoadingMessages ||
                              isCreating ||
                              Boolean(actionId)
                            }
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

          </Card>


          {/* MAIN CHAT */}

          <Card className="flex min-h-[680px] flex-col overflow-hidden p-0">

            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-8">

                <div className="max-w-md text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
                    <MessageSquare size={28} />
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-white">
                    Start your AI workspace
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Create a conversation to start
                    organizing your AI interactions.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleCreateConversation
                    }
                    disabled={isCreating}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                  >
                    <Plus size={17} />
                    New Conversation
                  </button>

                </div>

              </div>
            ) : (
              <>

                {/* CHAT HEADER */}

                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                      <MessageSquare size={20} />
                    </div>

                    <div className="min-w-0">

                      <h2 className="truncate text-base font-semibold text-white">
                        {selectedConversation.title ||
                          "New Chat"}
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        {messages.length}{" "}
                        message
                        {messages.length === 1
                          ? ""
                          : "s"}
                        {isStreaming && (
                          <span className="ml-2 text-cyan-300">
                            Ã‚Â· AI is responding
                          </span>
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="hidden items-center gap-2 sm:flex">

                    {selectedConversation.pinned && (
                      <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-medium text-cyan-300">
                        <Pin size={12} />
                        Pinned
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setEditingConversation(
                          selectedConversation
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                      title="Rename"
                    >
                      <Edit3 size={15} />
                    </button>

                  </div>

                </div>


                {/* CONVERSATION STATISTICS */}

                <div className="border-b border-white/10 bg-white/[0.015] px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <BarChart3 size={13} className="text-cyan-300" />
                    Conversation Statistics
                    {isLoadingStats && (
                      <Loader2 size={12} className="animate-spin text-cyan-300" />
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Hash size={12} /> Messages
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {conversationStats?.totalMessages ?? messages.length}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <UserRound size={12} /> You
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {conversationStats?.userMessages ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Bot size={12} /> AI
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {conversationStats?.assistantMessages ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Hash size={12} /> Words
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {conversationStats?.estimatedWords ?? 0}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 sm:col-span-1">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock3 size={12} /> Last activity
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-white">
                        {formatDate(conversationStats?.lastMessageAt || selectedConversation.updatedAt) || "Ã¢â‚¬â€"}
                      </p>
                    </div>
                  </div>

                  {conversationStats && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600">
                      <span>{conversationStats.totalCharacters?.toLocaleString?.() ?? 0} characters</span>
                      {conversationStats.firstMessageAt && (
                        <span>Started {formatDate(conversationStats.firstMessageAt)}</span>
                      )}
                    </div>
                  )}
                </div>


                {/* MESSAGES */}

                <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">

                  {isLoadingMessages ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2
                          size={20}
                          className="animate-spin text-cyan-300"
                        />
                        Loading messages...
                      </div>
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-600">
                        <MessageSquare size={23} />
                      </div>

                      <p className="mt-4 text-sm font-medium text-slate-400">
                        No messages yet
                      </p>

                      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">
                        This conversation is ready
                        for your next AI interaction.
                      </p>

                    </div>
                  ) : (
                    <div className="mx-auto max-w-4xl space-y-5">

                      {messages.map(
                        (message) => (
                          <MessageBubble
                            key={
                              message._id
                            }
                            message={
                              message
                            }
                            onCopy={handleCopyMessage}
                            onRegenerate={
                              handleRegenerateMessage
                            }
                            copied={
                              copiedMessageId ===
                              message._id
                            }
                            regenerating={
                              regeneratingMessageId ===
                              message._id
                            }
                            disabled={
                              isSending ||
                              isStreaming ||
                              isLoadingMessages ||
                              selectedConversation?.archived
                            }
                          />
                        )
                      )}

                      <div ref={messagesEndRef} />

                    </div>
                  )}

                </div>


                {/* COMPOSER */}

                <div className="border-t border-white/10 p-4 sm:p-5">

                  <div className="mx-auto max-w-4xl">

                    <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-2 focus-within:border-cyan-400/20">

                      <textarea
                        ref={messageInputRef}
                        disabled={
                          isSending ||
                          isStreaming ||
                          isLoadingMessages ||
                          selectedConversation?.archived
                        }
                        value={messageInput}
                        maxLength={MAX_MESSAGE_LENGTH}
                        aria-label="Message"
                        onChange={(event) =>
                          setMessageInput(
                            event.target.value.slice(
                              0,
                              MAX_MESSAGE_LENGTH
                            )
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder="Write a message..."
                        className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-700"
                      />

                      <button
                        type="button"
                        onClick={
                          handleSendMessage
                        }
                        disabled={
  !messageInput.trim() ||
  isSending ||
  isStreaming ||
  isLoadingMessages ||
  selectedConversation?.archived
}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isSending ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Send size={17} />
                        )}
                      </button>

                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-slate-700">
                      <span>
                        {isStreaming
                          ? "AI is generating a response..."
                          : selectedConversation?.archived
                            ? "This conversation is archived."
                            : "Enter to send Ã‚Â· Shift + Enter for a new line"}
                      </span>

                      <span
                        className={
                          messageInput.length >= MAX_MESSAGE_LENGTH
                            ? "text-rose-300"
                            : ""
                        }
                      >
                        {messageInput.length}/{MAX_MESSAGE_LENGTH}
                      </span>
                    </div>

                  </div>

                </div>

              </>
            )}

          </Card>

        </div>

      </div>


      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-rose-400/15 bg-slate-950 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
                <Trash2 size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  id="delete-conversation-title"
                  className="text-lg font-semibold text-white"
                >
                  Delete conversation?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will permanently delete{" "}
                  <span className="font-medium text-slate-300">
                    Ã¢â‚¬Å“{deleteTarget.title || "this conversation"}Ã¢â‚¬Â
                  </span>{" "}
                  and its messages. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(actionId)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteConversation}
                disabled={Boolean(actionId)}
                className="flex items-center gap-2 rounded-xl bg-rose-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          RENAME MODAL
      ================================================== */}

      {editingConversation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                  Conversation
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Rename Conversation
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingConversation(null)
                }
                aria-label="Close rename dialog"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X size={17} />
              </button>

            </div>

            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(event) =>
                setEditTitle(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !isRenaming &&
                  !isSending &&
                  !isStreaming
                ) {
                  handleRename();
                }
              }}
              aria-label="Conversation title"
              maxLength={100}
              placeholder="Conversation title"
              className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/20"
            />

            <div className="mt-5 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setEditingConversation(null)
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRename}
                disabled={
                  isRenaming ||
                  isSending ||
                  isStreaming ||
                  !editTitle.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRenaming ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={14} />
                )}

                Save Changes
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}
