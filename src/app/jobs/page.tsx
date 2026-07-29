import Link from "next/link";
import { Suspense } from "react";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { JobsView } from "@/components/app/jobs-view";

export default function PublicJobsPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf4] text-[#062b1f]">
      <header className="border-b border-[#e8e4d8] bg-[#fbfaf4]">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="ApplyAI home">
            <ApplyAiLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link className="rounded-full px-4 py-2 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f]" href="/login">
              Sign in
            </Link>
            <Link className="rounded-full bg-[#062b1f] px-4 py-2 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13]" href="/register">
              Create account
            </Link>
          </div>
        </div>
      </header>
      <Suspense
        fallback={
          <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-[#eff3df]" />
            <div className="mt-6 h-40 animate-pulse rounded-[24px] border border-[#e1ded1] bg-white" />
            <div className="mt-6 h-[520px] animate-pulse rounded-[24px] border border-[#e1ded1] bg-white" />
          </main>
        }
      >
        <JobsView publicMode />
      </Suspense>
    </div>
  );
}
