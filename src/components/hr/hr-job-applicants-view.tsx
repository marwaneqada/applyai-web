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
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";

function HrJobHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 border-b border-[#e8e4d8]/90 bg-[#fbfaf4]/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <ApplyAiLogo href="/hr" />
          <div className="hidden h-8 w-px bg-[#d8d5c8] sm:block" />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#588100]">HR workspace</p>
            <p className="mt-1 text-sm font-semibold text-[#20332a]">Applicants</p>
          </div>
        </div>
        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto" aria-label="HR workspace">
          <Link className="rounded-full px-4 py-2 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f]" href="/hr">
            Job posts
          </Link>
          <Link className="rounded-full bg-[#062b1f] px-4 py-2 text-sm font-semibold text-[#f7f5ec]" href="/hr?section=applicants">
            Applicants
          </Link>
          <Link className="rounded-full px-4 py-2 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f]" href="/hr?section=profile">
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button className="h-10 rounded-full border border-[#d8d5c8] bg-white px-4 text-sm font-semibold transition hover:border-[#a9c878]" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export function HrJobApplicantsView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { clearSession, logout, status, token, user } = useAuth();
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

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (status !== "authenticated" || user?.account_type !== "hr") {
    return (
      <main className="min-h-screen bg-[#fbfaf4] px-5 text-[#062b1f] sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <HrJobHeader onLogout={() => void handleLogout()} />
          <div className="grid min-h-[50vh] place-items-center">
            <p className="text-sm font-medium text-[#657167]">Loading job workspace...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf4] px-5 py-8 text-[#062b1f] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <HrJobHeader onLogout={() => void handleLogout()} />
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
              <HrApplicantsPanel companyId={job.company_id} jobId={job.id} />
            </section>
          </>
        ) : (
          <div className="mt-7 h-48 animate-pulse rounded-[28px] bg-[#eff3df]" />
        )}
      </div>
    </main>
  );
}
