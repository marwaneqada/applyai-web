import type { Metadata } from "next";
import { NewAnalysisView } from "@/components/app/analyses/new-analysis-view";

export const metadata: Metadata = {
  title: "New analysis | ApplyAI",
};

export default function NewAnalysisPage() {
  return <NewAnalysisView />;
}
