"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getAnalysis,
  getAnalysisStatus,
  type Analysis,
  type Application,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ApplicationFormModal } from "@/components/app/applications/application-form-modal";
import { AnalysisResults } from "./analysis-results";
import { AnalysisStatusBadge, formatDate, motionEase } from "./analysis-shared";
import { ResumePdfPanel } from "./resume-pdf-panel";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 48;

type LoadStatus = "loading" | "ready" | "error";

function BackLink() {
  return (
    <Link
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#405047] transition hover:text-[#062b1f]"
      href="/app/analyses"
    >
      <span aria-hidden="true">&larr;</span> All analyses
    </Link>
  );
}

export function AnalysisDetailView({ analysisId }: { analysisId: number }) {
  const { token } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollCycle, setPollCycle] = useState(0);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackedApp, setTrackedApp] = useState<Application | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await getAnalysis(token, analysisId);
      setAnalysis(data);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load this analysis. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [analysisId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const isPending =
    analysis?.status === "pending" || analysis?.status === "processing";

  useEffect(() => {
    if (!token || !isPending) {
      return;
    }

    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!active) {
        return;
      }

      attempts += 1;

      try {
        const status = await getAnalysisStatus(token, analysisId);

        if (!active) {
          return;
        }

        if (status === "completed" || status === "failed") {
          await load();
          return;
        }
      } catch {
        // Ignore transient polling errors and keep trying.
      }

      if (!active) {
        return;
      }

      if (attempts >= MAX_POLLS) {
        setPollTimedOut(true);
        return;
      }

      timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };

    timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [analysisId, isPending, load, pollCycle, token]);

  const recheck = useCallback(() => {
    setPollTimedOut(false);
    setPollCycle((cycle) => cycle + 1);
    void load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 lg:px-8">
      <BackLink />

      {loadStatus === "loading" ? (
        <div className="mt-6 grid gap-5">
          <div className="h-28 animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
          <div className="h-56 animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
        </div>
      ) : null}

      {loadStatus === "error" ? (
        <div className="mt-6 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{loadError}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={() => void load()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === "ready" && analysis ? (
        <>
          <motion.header
            className="mt-6 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-7"
            {...(reduceMotion
              ? {}
              : {
                  animate: { opacity: 1, y: 0 },
                  initial: { opacity: 0, y: 12 },
                  transition: { duration: 0.45, ease: motionEase },
                })}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-[#062b1f]">
                  {analysis.job_title}
                </h1>
                <p className="mt-1 text-sm text-[#657167]">
                  {analysis.company_name ? analysis.company_name : "No company"}
                  {formatDate(analysis.created_at)
                    ? ` · ${formatDate(analysis.created_at)}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <AnalysisStatusBadge status={analysis.status} />
                {trackedApp ? (
                  <span className="inline-flex items-center rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
                    Added to tracker
                  </span>
                ) : (
                  <button
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-4 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                    onClick={() => setTrackerOpen(true)}
                    type="button"
                  >
                    Add to tracker
                  </button>
                )}
              </div>
            </div>
            {analysis.job_url ? (
              <a
                className="mt-3 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-[#588100] transition hover:text-[#3f5e00]"
                href={analysis.job_url}
                rel="noreferrer"
                target="_blank"
              >
                {analysis.job_url}
              </a>
            ) : null}
          </motion.header>

          {trackedApp ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9e9c5] bg-[#f2ffd4] px-4 py-3">
              <p className="text-sm font-medium text-[#315000]">
                Saved to your application tracker.
              </p>
              <Link
                className="text-sm font-semibold text-[#315000] underline underline-offset-2 transition hover:text-[#203800]"
                href="/app/applications"
              >
                View board
              </Link>
            </div>
          ) : null}

          {isPending && !pollTimedOut ? (
            <div className="mt-5 rounded-[28px] border border-[#e1ded1] bg-white p-10 text-center shadow-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4df]">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#d9e9c5] border-t-[#4a8f16]" />
              </span>
              <p className="mt-4 text-base font-semibold text-[#062b1f]">
                Analyzing your resume against this role
              </p>
              <p className="mt-1 text-sm text-[#657167]">
                This usually takes under a minute. The page updates automatically.
              </p>
            </div>
          ) : null}

          {isPending && pollTimedOut ? (
            <div className="mt-5 rounded-[28px] border border-[#ecdcae] bg-[#fbf3da] p-8 text-center">
              <p className="text-base font-semibold text-[#7a5a12]">
                This is taking longer than usual
              </p>
              <p className="mt-1 text-sm text-[#7a5a12]/80">
                The analysis is still processing. You can keep waiting or check
                again.
              </p>
              <button
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                onClick={recheck}
                type="button"
              >
                Check again
              </button>
            </div>
          ) : null}

          {analysis.status === "failed" ? (
            <div className="mt-5 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-8">
              <p className="text-base font-semibold text-[#8b281f]">
                Analysis failed
              </p>
              <p className="mt-1 text-sm leading-6 text-[#8b281f]/90">
                {analysis.error_message ??
                  "Something went wrong while analyzing this resume."}
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                href="/app/analyses/new"
              >
                Start a new analysis
              </Link>
            </div>
          ) : null}

          {analysis.status === "completed" &&
          analysis.result &&
          typeof analysis.result.overall_score === "number" ? (
            <>
              {token ? (
                <ResumePdfPanel analysisId={analysis.id} token={token} />
              ) : null}
              <AnalysisResults result={analysis.result} />
            </>
          ) : null}

          {trackerOpen && token ? (
            <ApplicationFormModal
              analysisId={analysis.id}
              mode="create"
              onClose={() => setTrackerOpen(false)}
              onSaved={(application) => {
                setTrackedApp(application);
                setTrackerOpen(false);
              }}
              prefill={{
                company_name: analysis.company_name,
                job_title: analysis.job_title,
                job_url: analysis.job_url,
              }}
              token={token}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
