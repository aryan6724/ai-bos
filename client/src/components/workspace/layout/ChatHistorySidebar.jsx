import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "../../../store/WorkspaceContext";
import RenameDialog from "../chat/RenameDialog";

export default function ChatHistorySidebar() {
  const {
  conversations,
  conversationId,
  loadConversation,
  newConversation,

  renameChat,
  pinConversation,
  archiveChat,
  removeConversation,
} = useWorkspace();

  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const [renameChatId, setRenameChatId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");

  const filteredConversations = conversations.filter((chat) =>
    (chat.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pinnedChats = filteredConversations.filter(
    (chat) => chat.pinned
  );

  const recentChats = filteredConversations.filter(
    (chat) => !chat.pinned
  );

  useEffect(() => {
  function handleClickOutside(event) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setOpenMenu(null);
    }
  }

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

useEffect(() => {
  function handleEscape(event) {
    if (event.key === "Escape") {
      setOpenMenu(null);
      setRenameChatId(null);
    }
  }

  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener(
      "keydown",
      handleEscape
    );
  };
}, []);

  return (
    <aside className="flex h-full w-[290px] flex-col border-r border-slate-800 bg-[#111827]">
      {/* Header */}
      <div className="border-b border-slate-800 p-5">
        <button
          onClick={newConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-900 transition hover:bg-cyan-400"
        >
          <Plus size={18} />
          New Chat
        </button>

        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-xl border border-slate-700 bg-[#0B1220] py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {filteredConversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-500">
            {search
              ? "No matching conversations"
              : "No conversations yet"}
          </p>
        ) : (
          <>


{/* ========================= */}
{/* PINNED */}
{/* ========================= */}

{pinnedChats.length > 0 && (
  <>
    <div className="mb-2 mt-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">
      <Pin size={12} />
      Pinned
    </div>

    <div className="space-y-1">
  {pinnedChats.map((chat) => (
    <motion.div
      key={chat._id}
      whileHover={{
         x: 4,
        scale: 1.01,
     }}
      transition={{
  type: "spring",
  stiffness: 300,
}}
      className={`group relative flex items-center justify-between rounded-xl px-3 py-3 transition ${
        conversationId === chat._id
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {/* Chat Title */}
      <button
        onClick={() => loadConversation(chat._id)}
        className="flex flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <MessageSquare
          size={16}
          className="shrink-0 text-cyan-400"
        />

        <span className="truncate text-sm">
          {chat.title || "New Conversation"}
        </span>
      </button>

      {/* Three Dot */}
      <div
        ref={openMenu === chat._id ? menuRef : null}
        className="relative shrink-0"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();

            setOpenMenu(
              openMenu === chat._id
                ? null
                : chat._id
            );
          }}
          className="rounded p-1 hover:bg-slate-700"
        >
          <MoreHorizontal
            size={16}
            className="text-slate-500 opacity-0 transition group-hover:opacity-100"
          />
        </button>

        <AnimatePresence>
          {openMenu === chat._id && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{
                 type: "spring",
                 stiffness: 320,
                 damping: 22,
          }}
              className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-slate-700 bg-[#1E293B] py-2 shadow-xl"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameChatId(chat._id);
                  setRenameTitle(chat.title || "");
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                ✏️ Rename
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinConversation(chat._id);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                📌 {chat.pinned ? "Unpin" : "Pin"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  archiveChat(chat._id);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                📁 Archive
              </button>

              <hr className="my-2 border-slate-700" />

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  if (window.confirm("Delete this conversation?")) {
                    removeConversation(chat._id);
                  }

                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
              >
                🗑 Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  ))}
</div>

    <div className="my-4 border-b border-slate-800" />
  </>
)}

           
{/* ========================= */}
{/* RECENT */}
{/* ========================= */}

{recentChats.length > 0 && (
  <>
    <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
      Recent
    </div>

    <div className="space-y-1">
  {recentChats.map((chat) => (
    <motion.div
      key={chat._id}
      whileHover={{
  x: 4,
  scale: 1.01,
}}
transition={{
  type: "spring",
  stiffness: 300,
}}
      className={`group relative flex items-center justify-between rounded-xl px-3 py-3 transition ${
        conversationId === chat._id
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {/* Chat Title */}
      <button
        onClick={() => loadConversation(chat._id)}
        className="flex flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <MessageSquare
          size={16}
          className="shrink-0 text-cyan-400"
        />

        <span className="truncate text-sm">
          {chat.title || "New Conversation"}
        </span>
      </button>

      {/* Three Dot */}
      <div
        ref={openMenu === chat._id ? menuRef : null}
        className="relative shrink-0"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();

            setOpenMenu(
              openMenu === chat._id
                ? null
                : chat._id
            );
          }}
          className="rounded p-1 hover:bg-slate-700"
        >
          <MoreHorizontal
            size={16}
            className="text-slate-500 opacity-0 transition group-hover:opacity-100"
          />
        </button>

        <AnimatePresence>
          {openMenu === chat._id && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{
               type: "spring",
               stiffness: 320,
                damping: 22,
              }}
              className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-slate-700 bg-[#1E293B] py-2 shadow-xl"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameChatId(chat._id);
                  setRenameTitle(chat.title || "");
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                ✏️ Rename
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinConversation(chat._id);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                📌 {chat.pinned ? "Unpin" : "Pin"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  archiveChat(chat._id);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                📁 Archive
              </button>

              <hr className="my-2 border-slate-700" />

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  if (window.confirm("Delete this conversation?")) {
                    removeConversation(chat._id);
                  }

                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
              >
                🗑 Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  ))}
</div>
  </>
)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-[#0B1220] p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            AI-BOS
          </p>

          <p className="mt-2 font-medium text-white">
            Enterprise AI Workspace
          </p>

          <p className="mt-1 text-xs text-slate-400">
            GPT-4.1 • Gemini • Claude
          </p>
        </div>
      </div>
      <RenameDialog
        open={renameChatId !== null}
        initialValue={renameTitle}
        onClose={() => setRenameChatId(null)}
        onSave={async (title) => {
      if (title.trim()) {
        await renameChat(renameChatId, title);
      }

      setRenameChatId(null);
    }}
/>
    </aside>
  );
}