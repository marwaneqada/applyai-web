"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, getHrCompany, isUnauthorizedError, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { HrJobsPanel } from "@/components/hr/hr-jobs-panel";
import { HrApplicantsPanel } from "@/components/hr/hr-applicants-panel";
import { HrProfilePanel } from "@/components/hr/hr-profile-panel";
import { HrOverviewPanel } from "@/components/hr/hr-overview-panel";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";

const primaryItems = [
  { value: "overview", label: "Overview", icon: "overview" },
  { value: "jobs", label: "Job posts", icon: "jobs" },
  { value: "applicants", label: "Applicants", icon: "applicants" },
] as const;

type HrSection = "overview" | "jobs" | "applicants" | "profile";
type NavIconName = "overview" | "jobs" | "applicants" | "profile";

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, ReactNode> = {
    overview: <><path d="M3.5 10.5 10 4l6.5 6.5" /><path d="M5.5 9.5v6h9v-6M8 15.5v-3h4v3" /></>,
    jobs: <><rect x="3.5" y="4.5" width="13" height="11" rx="1.5" /><path d="M7 8h6M7 11h4" /></>,
    applicants: <><circle cx="8" cy="7" r="2.5" /><path d="M3.8 15.5c.6-2.2 2-3.3 4.2-3.3s3.6 1.1 4.2 3.3M13 5.5a2 2 0 0 1 0 3.8M13.4 12.5c1.6.2 2.5 1.2 2.8 2.6" /></>,
    profile: <><circle cx="10" cy="7" r="2.5" /><path d="M4.5 16c.8-2.6 2.6-4 5.5-4s4.7 1.4 5.5 4" /></>,
  };

  return <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">{paths[name]}</svg>;
}

function SectionNavigation({
  activeSection,
  mobile = false,
  onSelect,
}: {
  activeSection: HrSection;
  mobile?: boolean;
  onSelect: (section: HrSection) => void;
}) {
  return (
    <nav
      aria-label="HR workspace sections"
      className={mobile ? "flex min-w-max items-center gap-1" : "grid gap-1"}
    >
      {primaryItems.map((item) => {
        const active = item.value === activeSection;

        return (
          <button
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${mobile ? "shrink-0 rounded-md px-3 py-2" : "rounded-md px-3 py-2.5"} ${active ? "bg-[#e9f3dd] text-[#315b18]" : "text-[#526059] hover:bg-white/70 hover:text-[#20332a]"}`}
            key={item.value}
            onClick={() => onSelect(item.value as HrSection)}
            type="button"
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </button>
        );
      })}
      {!mobile ? (
        <div className="mt-7 border-t border-[#e2e6e0] pt-5">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.04em] text-[#7a847d]">Workspace</p>
          <button
            aria-current={activeSection === "profile" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${activeSection === "profile" ? "bg-[#e9f3dd] text-[#315b18]" : "text-[#526059] hover:bg-white/70 hover:text-[#20332a]"}`}
            onClick={() => onSelect("profile")}
            type="button"
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>
        </div>
      ) : null}
    </nav>
  );
}

export function HrWorkspaceView() {
  const { clearSession, logout, status, token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSubmissionId = Number(searchParams.get("submission_id"));
  const [company, setCompany] = useState<Company | null>(null);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "jobs" | "applicants" | "profile">(
    searchParams.get("section") === "jobs"
      ? "jobs"
      : searchParams.get("section") === "applicants"
      ? "applicants"
      : searchParams.get("section") === "profile"
        ? "profile"
        : "overview",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    function closeForNotificationMenu() {
      accountMenuRef.current?.removeAttribute("open");
    }

    window.addEventListener("applyai:account-menu-open", closeForNotificationMenu);
    return () => window.removeEventListener("applyai:account-menu-open", closeForNotificationMenu);
  }, []);

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
        searchParams.get("section") === "jobs"
          ? "jobs"
          : searchParams.get("section") === "applicants"
          ? "applicants"
          : searchParams.get("section") === "profile"
            ? "profile"
            : "overview",
      );
    });
  }, [searchParams]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function selectSection(section: "overview" | "jobs" | "applicants" | "profile") {
    const params = new URLSearchParams(searchParams.toString());

    if (section === "overview") {
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

  const pageCopy = activeSection === "overview"
    ? {
        title: "Hiring overview",
        description: "A current snapshot of your jobs and candidate activity.",
      }
    : activeSection === "jobs"
      ? {
          title: "Job posts",
          description: "Create roles and manage every application window.",
        }
      : activeSection === "applicants"
      ? {
          title: "Applicants",
          description: "Review candidates, match results, and hiring stages.",
        }
      : {
          title: "Profile & workspace",
          description: "Keep your recruiter identity and company details accurate.",
        };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#062b1f]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e2e6e0] bg-[#f3f5f1] lg:flex" aria-label="HR workspace navigation">
          <div className="flex h-16 shrink-0 items-center border-b border-[#e2e6e0] px-7">
            <ApplyAiLogo href="/hr" imgClassName="h-8 w-auto" />
          </div>
          <div className="px-7 pt-4">
            <div>
              <p className="truncate text-sm font-semibold text-[#20332a]">{company?.name ?? "Company workspace"}</p>
              <p className="mt-0.5 text-xs font-medium text-[#6a756d]">HR workspace</p>
            </div>
          </div>
          <div className="mt-8">
            <SectionNavigation activeSection={activeSection} onSelect={selectSection} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 h-16 border-b border-[#dde2db] bg-white/95 backdrop-blur">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-4 lg:hidden">
            <ApplyAiLogo href="/hr" imgClassName="h-8 w-auto" />
            <div className="hidden h-7 w-px bg-[#dde2db] sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-[#20332a]">
                {company?.name ?? "Company workspace"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#6a756d]">HR workspace</p>
            </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <NotificationBell />
                <details className="group relative" ref={accountMenuRef}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-[#f1f3ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] [&::-webkit-details-marker]:hidden" onClick={(event) => {
                    if (!event.currentTarget.parentElement?.hasAttribute("open")) {
                      window.dispatchEvent(new Event("applyai:notification-menu-open"));
                    }
                  }}>
                    <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-[#062b1f] text-xs font-semibold text-white">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden max-w-36 truncate text-sm font-semibold text-[#20332a] lg:block">{user.name}</span>
                    <svg aria-hidden="true" className="size-3.5 text-[#657167] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7"><path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-64 overflow-hidden rounded-xl border border-[#dfe4dc] bg-white shadow-[0_12px_28px_rgba(17,44,35,0.12)]" role="menu">
                    <div className="border-b border-[#edf0ec] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-[#20332a]">{user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6a756d]">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link className="block rounded-md px-3 py-2.5 text-sm font-semibold text-[#405047] transition hover:bg-[#f1f3ef] hover:text-[#20332a]" href="/hr?section=profile" role="menuitem">Profile</Link>
                      <button className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-[#405047] transition hover:bg-[#f1f3ef] hover:text-[#20332a]" onClick={() => void handleLogout()} role="menuitem" type="button">Logout</button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
            <div className="border-t border-[#edf0ec] px-4 py-1.5 lg:hidden">
              <div className="overflow-x-auto">
                <SectionNavigation activeSection={activeSection} mobile onSelect={selectSection} />
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-8">
            <section className="flex flex-col gap-1.5 py-5 sm:py-6">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#112c23]">{pageCopy.title}</h1>
              <p className="text-sm leading-6 text-[#6a756d]">{pageCopy.description}</p>
              {error ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e8c8c0] bg-[#fff8f6] px-4 py-3 text-sm text-[#8b3127]" role="alert">
                  <p>{error}</p>
                  <button className="font-semibold underline underline-offset-4" onClick={() => void load()} type="button">Retry</button>
                </div>
              ) : null}
            </section>

            <section className={activeSection === "overview" || activeSection === "jobs" ? "" : "rounded-xl border border-[#dde2db] bg-white p-5 sm:p-6"}>
              {activeSection === "overview" ? (
                <HrOverviewPanel companyId={company?.id} />
              ) : activeSection === "jobs" ? (
                <HrJobsPanel />
              ) : activeSection === "applicants" ? (
                <HrApplicantsPanel
                  companyId={company?.id}
                  submissionId={Number.isInteger(requestedSubmissionId) && requestedSubmissionId > 0 ? requestedSubmissionId : undefined}
                />
              ) : (
                <HrProfilePanel
                  onCompanyRenamed={(name) => setCompany((current) => current ? { ...current, name } : current)}
                />
              )}
            </section>
          </div>
      </div>
      </div>
    </main>
  );
}
