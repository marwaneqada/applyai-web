import type { Metadata } from "next";
import { ApplicationsBoardView } from "@/components/app/applications/applications-board-view";

export const metadata: Metadata = {
  title: "Applications | ApplyAI",
};

export default function ApplicationsPage() {
  return <ApplicationsBoardView />;
}
