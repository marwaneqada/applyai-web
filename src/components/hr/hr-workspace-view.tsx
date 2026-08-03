"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, getHrCompany, isUnauthorizedError, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { HrJobsPanel } from "@/components/hr/hr-jobs-panel";
import { HrApplicantsPanel } from "@/components/hr/hr-applicants-panel";
import { HrProfilePanel } from "@/components/hr/hr-profile-panel";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";

export function HrWorkspaceView() {
  const { clearSession, logout, status, token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSubmissionId = Number(searchParams.get("submission_id"));
  const [company, setCompany] = useState<Company | null>(null);
  const [activeSection, setActiveSection] = useState<"jobs" | "applicants" | "profile">(
    searchParams.get("section") === "applicants"
      ? "applicants"
      : searchParams.get("section") === "profile"
        ? "profile"
        : "jobs",
  );
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCompany(await getHrCompany(token));
      setError("");
    } catch (loadError) {
      if (isUnauthorizedError(loadError)) {
        clearSession();
        return;
      }

      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "We couldn't load your company workspace. Please try again.",
      );
    }
  }, [clearSession, token]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=%2Fhr");
      return;
    }

    if (status === "authenticated" && user?.account_type === "candidate") {
      router.replace("/app");
    }
  }, [router, status, user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setActiveSection(
        searchParams.get("section") === "applicants"
          ? "applicants"
          : searchParams.get("section") === "profile"
            ? "profile"
            : "jobs",
      );
    });
  }, [searchParams]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function selectSection(section: "jobs" | "applicants" | "profile") {
    const params = new URLSearchParams(searchParams.toString());

    if (section === "jobs") {
      params.delete("section");
    } else {
      params.set("section", section);
    }

    if (section !== "applicants") {
      params.delete("submission_id");
    }

    setActiveSection(section);
    router.replace(`/hr${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  if (status !== "authenticated" || user?.account_type !== "hr") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf4] px-5 text-[#062b1f]">
        <p className="text-sm font-medium text-[#657167]">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf4] px-5 py-10 text-[#062b1f] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="sticky top-0 z-20 -mx-5 border-b border-[#e8e4d8]/90 bg-[#fbfaf4]/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <ApplyAiLogo />
              <div className="hidden h-8 w-px bg-[#d8d5c8] sm:block" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#588100]">HR workspace</p>
                <p className="mt-1 text-sm font-semibold text-[#20332a]">{company?.name ?? "Company workspace"}</p>
              </div>
            </div>
            <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto" aria-label="HR workspace">
              {(["jobs", "applicants", "profile"] as const).map((section) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeSection === section ? "bg-[#062b1f] text-[#f7f5ec]" : "text-[#405047] hover:bg-[#eff3df] hover:text-[#062b1f]"}`}
                  key={section}
                  onClick={() => selectSection(section)}
                  type="button"
                >
                  {section === "jobs" ? "Job posts" : section === "applicants" ? "Applicants" : "Profile"}
                </button>
              ))}
            </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d5c8] bg-white px-5 text-sm font-semibold text-[#20332a] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
          </div>
        </header>

        <section className="flex flex-col gap-5 border-b border-[#e8e4d8] py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#588100]">
              {activeSection === "jobs" ? "Hiring overview" : activeSection === "applicants" ? "Candidate pipeline" : "Workspace identity"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome, {user?.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657167]">
              {activeSection === "jobs"
                ? "Create roles, control application windows, and keep your hiring workspace organized."
                : activeSection === "applicants"
                  ? "Review applicants, inspect match results, and move candidates through your hiring process."
                  : "Keep your recruiter identity and company workspace details accurate."}
            </p>
          </div>
        </section>

        {activeSection !== "profile" ? <section className="mt-8 rounded-[24px] border border-[#e1ded1] bg-white px-6 py-5 shadow-sm">
          <h2 className="text-sm font-semibold">Company</h2>
          {error ? (
            <div className="mt-5 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm font-medium text-[#8b281f]" role="alert">
              <p>{error}</p>
              <button className="mt-3 font-semibold underline" onClick={() => void load()} type="button">
                Try again
              </button>
            </div>
          ) : company ? (
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Company name</dt>
                <dd className="mt-1 text-lg font-semibold text-[#20332a]">{company.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Your role</dt>
                <dd className="mt-1 text-lg font-semibold capitalize text-[#20332a]">{company.membership_role}</dd>
              </div>
            </dl>
          ) : (
            <div className="mt-6 h-20 animate-pulse rounded-2xl bg-[#eff3df]" />
          )}
        </section> : null}

        <section className="mt-6 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8">
          {activeSection === "jobs" ? (
            <HrJobsPanel />
          ) : activeSection === "applicants" ? (
            <HrApplicantsPanel
              companyId={company?.id}
              submissionId={Number.isInteger(requestedSubmissionId) && requestedSubmissionId > 0 ? requestedSubmissionId : undefined}
            />
          ) : (
            <HrProfilePanel
              onCompanyRenamed={(name) =>
                setCompany((current) => current ? { ...current, name } : current)
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
