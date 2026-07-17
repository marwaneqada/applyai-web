import type { Metadata } from "next";
import { CandidateProfileView } from "@/components/app/candidate-profile-view";

export const metadata: Metadata = {
  title: "Profile | ApplyAI",
};

export default function CandidateProfilePage() {
  return <CandidateProfileView />;
}
