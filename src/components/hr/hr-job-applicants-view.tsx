"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ApiError,
  getHrJob,
  isUnauthorizedError,
  type HrJob,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { HrApplicantsPanel } from "@/components/hr/hr-applicants-panel";

export function HrJobApplicantsView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { clearSession, status, token, user } = useAuth();
  const [job, setJob] = useState<HrJob | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setJob(await getHrJob(token, Number(id)));
      setError("");
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "We couldn't load this job.",
        );
      }
    }
  }, [clearSession, id, token]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?redirect=${encodeURIComponent(`/hr/jobs/${id}`)}`);
    } else if (status === "authenticated" && user?.account_type !== "hr") {
      router.replace("/app");
    }
  }, [id, router, status, user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (status !== "authenticated" || user?.account_type !== "hr") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf4]">
        <p className="text-sm font-medium text-[#657167]">Loading job workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf4] px-5 py-8 text-[#062b1f] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link className="text-sm font-semibold text-[#405047] hover:text-[#062b1f]" href="/hr">
          ← HR workspace
        </Link>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-5 text-sm font-semibold text-[#8b281f]" role="alert">
            {error}
          </div>
        ) : job ? (
          <>
            <header className="mt-6 border-b border-[#d8d5c8] pb-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#588100]">{job.company_name}</p>
                  <h1 className="mt-2 text-3xl font-semibold">{job.title}</h1>
                  <p className="mt-3 text-sm text-[#657167]">
                    {job.location || "Location not specified"} · {job.submissions_count ?? 0} applicants
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eff3df] px-3 py-1.5 text-xs font-semibold text-[#405047]">
                    {job.employment_type?.replaceAll("_", " ") ?? "Type not specified"}
                  </span>
                  <span className="rounded-full bg-[#eff3df] px-3 py-1.5 text-xs font-semibold capitalize text-[#405047]">
                    {job.status}
                  </span>
                </div>
              </div>
            </header>

            <section className="mt-7 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8">
              <HrApplicantsPanel jobId={job.id} />
            </section>
          </>
        ) : (
          <div className="mt-7 h-48 animate-pulse rounded-[28px] bg-[#eff3df]" />
        )}
      </div>
    </main>
  );
}
