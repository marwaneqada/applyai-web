import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalysisDetailView } from "@/components/app/analyses/analysis-detail-view";

export const metadata: Metadata = {
  title: "Analysis | ApplyAI",
};

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysisId = Number(id);

  if (!Number.isInteger(analysisId) || analysisId <= 0) {
    notFound();
  }

  return <AnalysisDetailView analysisId={analysisId} />;
}
