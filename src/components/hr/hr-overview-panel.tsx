"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  isUnauthorizedError,
  listHrJobs,
  listHrSubmissions,
  type HrJob,
  type JobSubmission,
  type JobSubmissionStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCompanyRealtime } from "@/contexts/realtime-context";

const pipelineStatuses: Array<{ label: string; value: JobSubmissionStatus }> = [
  { label: "New", value: "new" },
  { label: "Screening", value: "screening" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
];

const statusStyle: Record<JobSubmissionStatus, string> = {
  new: "bg-[#eef5da] text-[#405b13]",
  screening: "bg-[#e7f0ee] text-[#235046]",
  interview: "bg-[#e7eff9] text-[#264f78]",
  offer: "bg-[#f5edcf] text-[#6c5310]",
  hired: "bg-[#dff1d9] text-[#285c21]",
  rejected: "bg-[#f5e5e1] text-[#8b3127]",
};

type OverviewData = {
  openJobs: HrJob[];
  openJobCount: number;
  totalApplicants: number;
  recentApplications: JobSubmission[];
  pipeline: Record<JobSubmissionStatus, number>;
};

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function OverviewSkeleton() {
  return (
    <div aria-label="Loading hiring overview" className="space-y-5" role="status">
      <div className="h-[74px] animate-pulse rounded-xl border border-[#e1e5df] bg-white" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <div className="h-80 animate-pulse rounded-xl border border-[#e1e5df] bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-[#e1e5df] bg-white" />
      </div>
    </div>
  );
}

export function HrOverviewPanel({ companyId }: { companyId?: number }) {
  const { clearSession, token } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!token) return;

    if (!silent) setLoading(true);
    setError("");

    try {
      const [openJobs, recentApplications, ...pipelineResponses] = await Promise.all([
        listHrJobs(token, 1, 5, "open"),
        listHrSubmissions(token, { sort: "submitted_at", direction: "desc" }, 1, 5),
        ...pipelineStatuses.map(({ value }) =>
          listHrSubmissions(token, { status: value }, 1, 1),
        ),
      ]);

      const pipeline = Object.fromEntries(
        pipelineStatuses.map(({ value }, index) => [
          value,
          pipelineResponses[index].meta.total,
        ]),
      ) as Record<JobSubmissionStatus, number>;

      setData({
        openJobs: openJobs.data,
        openJobCount: openJobs.meta.total,
        totalApplicants: recentApplications.meta.total,
        recentApplications: recentApplications.data,
        pipeline,
      });
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "We couldn't load the hiring overview. Please try again.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [clearSession, token]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  useCompanyRealtime(companyId, () => {
    void load(true);
  });

  if (loading && !data) return <OverviewSkeleton />;

  if (error && !data) {
    return (
      <div className="rounded-xl border border-[#e8c8c0] bg-[#fff8f6] px-5 py-6 text-sm text-[#8b3127]" role="alert">
        <p className="font-semibold">Hiring overview is temporarily unavailable</p>
        <p className="mt-1 leading-6">{error}</p>
        <button className="mt-3 font-semibold underline underline-offset-4" onClick={() => void load()} type="button">
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const shortlisted = data.pipeline.screening + data.pipeline.interview + data.pipeline.offer;
  const metrics = [
    { label: "Open jobs", value: data.openJobCount },
    { label: "Total applicants", value: data.totalApplicants },
    { label: "New applicants", value: data.pipeline.new },
    { label: "Shortlisted", value: shortlisted },
  ];
  const activeJobsSummary = data.openJobs.length < data.openJobCount
    ? `Showing ${data.openJobs.length} of ${data.openJobCount} open jobs`
    : `${data.openJobCount} open ${data.openJobCount === 1 ? "job" : "jobs"} accepting applications`;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e8c8c0] bg-[#fff8f6] px-4 py-3 text-sm text-[#8b3127]" role="status">
          <p>Live data could not be refreshed. Showing the last loaded overview.</p>
          <button className="font-semibold underline underline-offset-4" onClick={() => void load(true)} type="button">Retry</button>
        </div>
      ) : null}

      <dl aria-label="Hiring metrics" className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#dde2db] bg-white md:grid-cols-4">
        {metrics.map((metric, index) => (
          <div className={`px-4 py-3.5 sm:px-5 ${index % 2 === 1 ? "border-l border-[#e6eae4]" : ""} ${index >= 2 ? "border-t border-[#e6eae4] md:border-t-0" : ""} ${index > 0 ? "md:border-l md:border-[#e6eae4]" : ""}`} key={metric.label}>
            <dt className="text-xs font-medium text-[#6a756d]">{metric.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.02em] text-[#112c23]">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border border-[#dde2db] bg-white" aria-labelledby="recent-applications-heading">
          <div className="flex items-center justify-between gap-4 border-b border-[#e6eae4] px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-[#112c23]" id="recent-applications-heading">Recent applications</h2>
              <p className="mt-0.5 text-xs text-[#6a756d]">The latest candidates across every role.</p>
            </div>
            <Link className="shrink-0 text-sm font-semibold text-[#3f711d] hover:text-[#24490f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]" href="/hr?section=applicants">View all</Link>
          </div>

          {data.recentApplications.length ? (
            <ul className="divide-y divide-[#edf0ec]">
              {data.recentApplications.map((application) => (
                <li key={application.id}>
                  <Link className="group flex cursor-pointer items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8f9f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#588100] sm:px-5" href={`/hr?section=applicants&submission_id=${application.id}`}>
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf3e8] text-sm font-semibold text-[#315b18]">
                      {application.applicant_name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#20332a]">{application.applicant_name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#6a756d]">{application.job.title} · {formatDate(application.submitted_at)}</span>
                    </span>
                    {application.match?.status === "completed" && application.match.overall_score !== null ? (
                      <span className="hidden text-xs font-semibold tabular-nums text-[#526059] sm:block">{application.match.overall_score}% match</span>
                    ) : null}
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusStyle[application.status]}`}>{application.status}</span>
                    <svg aria-hidden="true" className="size-4 shrink-0 text-[#8a938c] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8"><path d="m7.5 4.5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-[#20332a]">No applications yet</p>
              <p className="mt-1 text-sm text-[#6a756d]">New candidates will appear here as they apply.</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#dde2db] bg-white" aria-labelledby="active-jobs-heading">
          <div className="flex items-center justify-between gap-4 border-b border-[#e6eae4] px-4 py-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#112c23]" id="active-jobs-heading">Active jobs</h2>
              <p className="mt-0.5 text-xs text-[#6a756d]">{activeJobsSummary}.</p>
            </div>
            <Link className="shrink-0 text-sm font-semibold text-[#3f711d] hover:text-[#24490f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]" href="/hr?section=jobs">Manage</Link>
          </div>

          {data.openJobs.length ? (
            <ul className="divide-y divide-[#edf0ec]">
              {data.openJobs.map((job) => (
                <li key={job.id}>
                  <Link className="group block cursor-pointer px-4 py-3.5 transition hover:bg-[#f8f9f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#588100]" href={`/hr/jobs/${job.id}`}>
                    <span className="block truncate text-sm font-semibold text-[#20332a]">{job.title}</span>
                    <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6a756d]">
                      <span className="truncate">{job.location || "Location not set"}</span>
                      <span className="shrink-0 font-medium tabular-nums text-[#526059]">{job.submissions_count ?? 0} {(job.submissions_count ?? 0) === 1 ? "applicant" : "applicants"}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[#20332a]">No open jobs</p>
              <Link className="mt-2 inline-flex text-sm font-semibold text-[#3f711d] underline-offset-4 hover:underline" href="/hr?section=jobs">Create or publish a job</Link>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-[#dde2db] bg-white px-4 py-4 sm:px-5" aria-labelledby="pipeline-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#112c23]" id="pipeline-heading">Hiring pipeline</h2>
            <p className="mt-0.5 text-xs text-[#6a756d]">Current candidate distribution by stage.</p>
          </div>
          <Link className="mt-2 text-sm font-semibold text-[#3f711d] hover:text-[#24490f] sm:mt-0" href="/hr?section=applicants">Open applicants</Link>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#edf0ec] pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {pipelineStatuses.map(({ label, value }) => (
            <div className="relative flex items-start gap-2" key={value}>
              <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${value === "hired" ? "bg-[#5d9a27]" : value === "rejected" ? "bg-[#b75545]" : "bg-[#8a958c]"}`} />
              <span>
                <dt className="text-xs font-medium text-[#6a756d]">{label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[#20332a]">{data.pipeline[value]}</dd>
              </span>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
