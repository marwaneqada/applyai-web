import type { Metadata } from "next";
import { AnalysesListView } from "@/components/app/analyses/analyses-list-view";

export const metadata: Metadata = {
  title: "Analyses | ApplyAI",
};

export default function AnalysesPage() {
  return <AnalysesListView />;
}
