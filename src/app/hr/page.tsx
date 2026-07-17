import type { Metadata } from "next";
import { HrWorkspaceView } from "@/components/hr/hr-workspace-view";

export const metadata: Metadata = {
  title: "HR workspace | ApplyAI",
};

export default function HrPage() {
  return <HrWorkspaceView />;
}
