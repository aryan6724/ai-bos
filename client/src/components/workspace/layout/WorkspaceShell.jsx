import WorkspaceHeader from "../WorkspaceHeader";
import LeftRail from "./LeftRail";
import ChatHistorySidebar from "./ChatHistorySidebar";
import ChatPanel from "../ChatPanel";

export default function WorkspaceShell() {
  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#09090B] shadow-2xl">

      {/* Header */}
      <WorkspaceHeader />

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1">

        {/* Left Icon Rail */}
        <LeftRail />

        {/* Chat History */}
        <ChatHistorySidebar />

        {/* Conversation */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#0B1220]">

          <ChatPanel />

        </main>

      </div>

    </div>
  );
}