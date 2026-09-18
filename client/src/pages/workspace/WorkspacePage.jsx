import DashboardLayout from "../../layouts/DashboardLayout";
import { WorkspaceProvider } from "../../store/WorkspaceContext";

import WorkspaceShell from "../../components/workspace/layout/WorkspaceShell";

export default function WorkspacePage() {
  return (
    <DashboardLayout>
      <WorkspaceProvider>

        <WorkspaceShell />

      </WorkspaceProvider>
    </DashboardLayout>
  );
}