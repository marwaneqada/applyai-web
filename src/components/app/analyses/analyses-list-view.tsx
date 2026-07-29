"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  listAnalyses,
  retryAnalysis,
  type Analysis,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useTour } from "@/components/app/tour/tour-context";
import {
  AnalysisStatusBadge,
  formatDate,
  motionEase,
  scoreBand,
} from "./analysis-shared";

type LoadStatus = "loading" | "ready" | "error";

function NewAnalysisButton({ className = "" }: { className?: string }) {
  const { goTo } = useTour();

  return (
    <Link
      className={`inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] ${className}`}
      href="/app/analyses/new"
      onClick={() => goTo("create-analysis")}
    >
      New analysis
    </Link>
  );
}

function ScoreChip({ value }: { value: number }) {
  const band = scoreBand(value);

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded-full border px-3 py-1 text-xs font-semibold ${band.chip}`}
    >
      <span className="text-sm">{Math.round(value)}</span>
      <span className="opacity-70">/100</span>
    </span>
  );
}

export function AnalysesListView() {
  const { token } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [retryErrors, setRetryErrors] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await listAnalyses(token);
      setAnalyses(data);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your analyses. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function retry() {
    setLoadStatus("loading");
    setLoadError("");
    void load();
  }

  async function retryFailedAnalysis(analysisId: number) {
    if (!token || retryingId !== null) {
      return;
    }

    setRetryingId(analysisId);
    setRetryErrors((current) => ({ ...current, [analysisId]: "" }));

    try {
      await retryAnalysis(token, analysisId);
      router.push(`/app/analyses/${analysisId}`);
    } catch (error) {
      setRetryErrors((current) => ({
        ...current,
        [analysisId]:
          error instanceof ApiError
            ? error.message
            : "We couldn't retry this analysis. Please try again.",
      }));
      setRetryingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
      <motion.header
        className="flex flex-wrap items-end justify-between gap-4"
        data-tour="analyses-overview"
        {...(reduceMotion
          ? {}
          : {
              animate: { opacity: 1, y: 0 },
              initial: { opacity: 0, y: 12 },
              transition: { duration: 0.5, ease: motionEase },
            })}
      >
        <div>
          <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
            Analyses
          </p>
          <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">
            Resume analyses
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
            Match a resume against a job description to get scores, keyword gaps,
            rewritten bullets, and a tailored cover letter.
          </p>
        </div>
        {loadStatus === "ready" && analyses.length > 0 ? (
          <NewAnalysisButton />
        ) : null}
      </motion.header>

      {loadStatus === "loading" ? (
        <ul className="mt-8 grid gap-3">
          {[0, 1, 2].map((key) => (
            <li
              className="h-24 animate-pulse rounded-[24px] border border-[#e8e4d8] bg-white"
              key={key}
            />
          ))}
        </ul>
      ) : null}

      {loadStatus === "error" ? (
        <div className="mt-8 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{loadError}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === "ready" && analyses.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#d8d5c8] bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-[#062b1f]">
            No analyses yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#657167]">
            Run your first analysis to see how well your resume matches a role.
          </p>
          <NewAnalysisButton className="mt-5" />
        </div>
      ) : null}

      {loadStatus === "ready" && analyses.length > 0 ? (
        <ul className="mt-8 grid gap-3">
          <AnimatePresence initial={false}>
            {analyses.map((analysis) => (
              <motion.li
                key={analysis.id}
                layout={!reduceMotion}
                {...(reduceMotion
                  ? {}
                  : {
                      animate: { opacity: 1, y: 0 },
                      initial: { opacity: 0, y: 8 },
                      transition: { duration: 0.28, ease: motionEase },
                    })}
              >
                <div className="rounded-[24px] border border-[#e1ded1] bg-white p-5 shadow-sm transition hover:border-[#cfcbbb] hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      className="min-w-0 flex-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a6f20f]"
                      href={`/app/analyses/${analysis.id}`}
                    >
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
                    </Link>
                    <div className="flex shrink-0 items-center gap-2.5">
                      {analysis.status === "completed" &&
                      analysis.result &&
                      typeof analysis.result.overall_score === "number" ? (
                        <ScoreChip value={analysis.result.overall_score} />
                      ) : null}
                      <AnalysisStatusBadge status={analysis.status} />
                      {analysis.status === "failed" ? (
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-full bg-[#062b1f] px-4 text-xs font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                          disabled={retryingId !== null}
                          onClick={() => void retryFailedAnalysis(analysis.id)}
                          type="button"
                        >
                          {retryingId === analysis.id ? "Retrying..." : "Retry"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {retryErrors[analysis.id] ? (
                    <p className="mt-3 text-xs font-medium text-[#8b281f]">
                      {retryErrors[analysis.id]}
                    </p>
                  ) : null}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </main>
  );
}
