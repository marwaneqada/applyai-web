import type { Metadata } from "next";
import { Suspense } from "react";
import { HrWorkspaceView } from "@/components/hr/hr-workspace-view";

export const metadata: Metadata = {
  title: "HR workspace | ApplyAI",
};

export default function HrPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf4]" />}>
      <HrWorkspaceView />
    </Suspense>
  );
}
