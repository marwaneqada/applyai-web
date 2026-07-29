"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getHrCompany, isUnauthorizedError, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { HrJobsPanel } from "@/components/hr/hr-jobs-panel";
import { HrApplicantsPanel } from "@/components/hr/hr-applicants-panel";

export function HrWorkspaceView() {
  const { clearSession, logout, status, token, user } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [activeSection, setActiveSection] = useState<"jobs" | "applicants">("jobs");
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

  async function handleLogout() {
    await logout();
    router.replace("/login");
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
        <header className="flex flex-col gap-5 border-b border-[#e8e4d8] pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#588100]">HR workspace</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome, {user?.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657167]">
              Your company workspace is ready. Job posting and candidate management come next.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d5c8] bg-white px-5 text-sm font-semibold text-[#20332a] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </header>

        <section className="mt-8 rounded-[24px] border border-[#e1ded1] bg-white px-6 py-5 shadow-sm">
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
        </section>

        <div className="mt-7 flex gap-1 border-b border-[#d8d5c8]" role="tablist" aria-label="HR workspace sections">
          {(["jobs", "applicants"] as const).map((section) => (
            <button
              aria-selected={activeSection === section}
              className={`relative px-5 pb-3 pt-2 text-sm font-semibold capitalize transition ${
                activeSection === section
                  ? "text-[#062b1f] after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-[#588100]"
                  : "text-[#657167] hover:text-[#20332a]"
              }`}
              key={section}
              onClick={() => setActiveSection(section)}
              role="tab"
              type="button"
            >
              {section}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8">
          {activeSection === "jobs" ? <HrJobsPanel /> : <HrApplicantsPanel />}
        </section>
      </div>
    </main>
  );
}
