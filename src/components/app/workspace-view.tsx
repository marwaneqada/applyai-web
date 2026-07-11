"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  getApplicationBoard,
  listAnalyses,
  listResumes,
  type Analysis,
  type ApplicationBoard,
  type Resume,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useTour } from "@/components/app/tour/tour-context";
import {
  AnalysisStatusBadge,
  formatDate,
  scoreBand,
} from "@/components/app/analyses/analysis-shared";
import {
  STATUS_ORDER,
  statusMeta,
} from "@/components/app/applications/applications-shared";

type LoadStatus = "loading" | "ready" | "error";

const motionEase = [0.22, 1, 0.36, 1] as const;

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14m0 0-5-5m5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6 21a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8l5 5v12a1 1 0 0 1-1 1H6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="2" width="5" x="4" y="4" />
      <rect height="10" rx="2" width="5" x="10" y="4" />
      <rect height="13" rx="2" width="5" x="16" y="4" />
    </svg>
  );
}

function StatTile({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      className="rounded-2xl border border-[#e1ded1] bg-white px-4 py-3 shadow-sm transition hover:border-[#cfcbbb] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
      href={href}
    >
      <p className="text-2xl font-semibold text-[#062b1f]">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-[#657167]">{label}</p>
    </Link>
  );
}

function QuickAction({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Link
      className="group flex items-start gap-3 rounded-[24px] border border-[#e1ded1] bg-white p-5 shadow-sm transition hover:border-[#cfcbbb] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
      href={href}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f2ffd4] text-[#315000]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-semibold text-[#062b1f]">
          {title}
          <span className="text-[#588100] transition group-hover:translate-x-0.5">
            <ArrowIcon />
          </span>
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#657167]">
          {description}
        </span>
      </span>
    </Link>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function WorkspaceView() {
  const { token, user } = useAuth();
  const { start: startTour } = useTour();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [board, setBoard] = useState<ApplicationBoard | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [resumeData, analysisData, boardData] = await Promise.all([
        listResumes(token),
        listAnalyses(token),
        getApplicationBoard(token),
      ]);

      setResumes(resumeData);
      setAnalyses(analysisData);
      setBoard(boardData);
      setError("");
      setStatus("ready");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't load your workspace. Please try again.",
      );
      setStatus("error");
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const applicationTotal = board
    ? STATUS_ORDER.reduce((sum, key) => sum + board[key].length, 0)
    : 0;
  const recentAnalyses = analyses.slice(0, 4);
  const isEmpty =
    status === "ready" &&
    resumes.length === 0 &&
    analyses.length === 0 &&
    applicationTotal === 0;

  const firstName = user?.name ? user.name.split(" ")[0] : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
      <motion.header
        {...(reduceMotion
          ? {}
          : {
              animate: { opacity: 1, y: 0 },
              initial: { opacity: 0, y: 12 },
              transition: { duration: 0.5, ease: motionEase },
            })}
      >
        <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
          Workspace
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
          Upload a resume, analyze it against a role, and track every application
          in one place.
        </p>
      </motion.header>

      <div
        className="mt-6 flex flex-col gap-4 rounded-[28px] border border-[#d9e9c5] bg-[#f2ffd4] p-6 sm:flex-row sm:items-center sm:justify-between"
        data-tour="wk-guide"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#062b1f] text-[#a6f20f]">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="m15 9-2.2 4.8L8 16l2.2-4.8L15 9Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-[#062b1f]">
              New to ApplyAI? Take the guided tour
            </p>
            <p className="mt-1 text-sm leading-6 text-[#3f5a24]">
              A quick walkthrough from uploading a resume to downloading a tailored
              PDF and tracking the application.
            </p>
          </div>
        </div>
        <button
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
          onClick={startTour}
          type="button"
        >
          Take the tour
        </button>
      </div>

      {status === "loading" ? (
        <div className="mt-8 grid gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div
                className="h-20 animate-pulse rounded-2xl border border-[#e8e4d8] bg-white"
                key={key}
              />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-8 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{error}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={() => {
              setStatus("loading");
              void load();
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {isEmpty ? (
        <Panel className="mt-8">
          <h2 className="text-lg font-semibold text-[#062b1f]">Get started</h2>
          <p className="mt-1 text-sm text-[#657167]">
            Three steps to your first tailored application.
          </p>
          <ol className="mt-5 grid gap-3">
            {[
              {
                body: "Upload a PDF resume so we can read and reuse it.",
                cta: "Upload resume",
                href: "/app/resumes",
                title: "Add a resume",
              },
              {
                body: "Paste a job description and get scores, gaps, and rewrites.",
                cta: "Run analysis",
                href: "/app/analyses/new",
                title: "Analyze a role",
              },
              {
                body: "Track each role from saved to offer on your board.",
                cta: "Open tracker",
                href: "/app/applications",
                title: "Track applications",
              },
            ].map((step, index) => (
              <li
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e8e4d8] bg-[#fbfaf4] p-4"
                key={step.title}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#062b1f] text-sm font-semibold text-[#f7f5ec]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#062b1f]">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#657167]">
                    {step.body}
                  </span>
                </span>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                  href={step.href}
                >
                  {step.cta}
                </Link>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}

      {status === "ready" && !isEmpty && board ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile href="/app/resumes" label="Resumes" value={resumes.length} />
            <StatTile href="/app/analyses" label="Analyses" value={analyses.length} />
            <StatTile
              href="/app/applications"
              label="Applications"
              value={applicationTotal}
            />
            <StatTile
              href="/app/applications"
              label="Offers"
              value={board.offer.length}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <QuickAction
              description="Add a PDF to analyze against roles."
              href="/app/resumes"
              icon={<DocumentIcon />}
              title="Upload a resume"
            />
            <QuickAction
              description="Score your resume against a job."
              href="/app/analyses/new"
              icon={<SparkIcon />}
              title="Run an analysis"
            />
            <QuickAction
              description="Track applications on your board."
              href="/app/applications"
              icon={<BoardIcon />}
              title="Open tracker"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#062b1f]">
                  Recent analyses
                </h2>
                <Link
                  className="text-sm font-semibold text-[#588100] transition hover:text-[#3f5e00]"
                  href="/app/analyses"
                >
                  View all
                </Link>
              </div>

              {recentAnalyses.length === 0 ? (
                <p className="mt-4 text-sm text-[#657167]">No analyses yet.</p>
              ) : (
                <ul className="mt-4 grid gap-2.5">
                  {recentAnalyses.map((analysis) => {
                    const score = analysis.result?.overall_score;
                    const hasScore =
                      analysis.status === "completed" &&
                      typeof score === "number";

                    return (
                      <li key={analysis.id}>
                        <Link
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8e4d8] bg-[#fbfaf4] px-4 py-3 transition hover:border-[#cfcbbb] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                          href={`/app/analyses/${analysis.id}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#062b1f]">
                              {analysis.job_title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#657167]">
                              {analysis.company_name
                                ? analysis.company_name
                                : "No company"}
                              {formatDate(analysis.created_at)
                                ? ` · ${formatDate(analysis.created_at)}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2.5">
                            {hasScore ? (
                              <span
                                className={`inline-flex items-baseline gap-0.5 rounded-full border px-3 py-1 text-xs font-semibold ${scoreBand(score).chip}`}
                              >
                                <span className="text-sm">{Math.round(score)}</span>
                                <span className="opacity-70">/100</span>
                              </span>
                            ) : null}
                            <AnalysisStatusBadge status={analysis.status} />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#062b1f]">Pipeline</h2>
                <Link
                  className="text-sm font-semibold text-[#588100] transition hover:text-[#3f5e00]"
                  href="/app/applications"
                >
                  Board
                </Link>
              </div>
              <ul className="mt-4 grid gap-2">
                {STATUS_ORDER.map((key) => (
                  <li
                    className="flex items-center justify-between rounded-xl px-1 py-1.5"
                    key={key}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-[#405047]">
                      <span
                        className={`h-2 w-2 rounded-full ${statusMeta[key].dotClassName}`}
                      />
                      {statusMeta[key].label}
                    </span>
                    <span className="text-sm font-semibold text-[#062b1f]">
                      {board[key].length}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      ) : null}
    </main>
  );
}
