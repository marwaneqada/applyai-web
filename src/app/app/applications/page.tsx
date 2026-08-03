import type { Metadata } from "next";
import { Suspense } from "react";
import { MyApplicationsView } from "@/components/app/applications/my-applications-view";

export const metadata: Metadata = {
  title: "Applications | ApplyAI",
};

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-[#fbfaf4]" />}>
      <MyApplicationsView />
    </Suspense>
  );
}
