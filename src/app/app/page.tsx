import type { Metadata } from "next";
import { WorkspaceView } from "@/components/app/workspace-view";

export const metadata: Metadata = {
  title: "Workspace | ApplyAI",
};

export default function AppPage() {
  return <WorkspaceView />;
}
