import type { Metadata } from "next";
import { HrJobApplicantsView } from "@/components/hr/hr-job-applicants-view";

export const metadata: Metadata = {
  title: "Job applicants | ApplyAI",
};

export default function HrJobApplicantsPage() {
  return <HrJobApplicantsView />;
}
