import { Suspense } from "react";
import { JobsView } from "@/components/app/jobs-view";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-[#eff3df]" />
          <div className="mt-6 h-40 animate-pulse rounded-[24px] border border-[#e1ded1] bg-white" />
          <div className="mt-6 h-[520px] animate-pulse rounded-[24px] border border-[#e1ded1] bg-white" />
        </main>
      }
    >
      <JobsView />
    </Suspense>
  );
}
