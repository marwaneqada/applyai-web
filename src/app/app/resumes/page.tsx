import type { Metadata } from "next";
import { ResumesView } from "@/components/app/resumes-view";

export const metadata: Metadata = {
  title: "Resumes | ApplyAI",
};

export default function ResumesPage() {
  return <ResumesView />;
}
