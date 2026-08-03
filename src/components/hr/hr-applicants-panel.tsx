"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ApiError,
  downloadHrSubmissionDocument,
  isUnauthorizedError,
  listHrJobOptions,
  listHrSubmissions,
  reanalyzeHrSubmission,
  updateHrSubmission,
  type HrJobOption,
  type JobSubmission,
  type JobSubmissionFilters,
  type JobSubmissionSource,
  type JobSubmissionStatus,
  type PaginationMeta,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCompanyRealtime } from "@/contexts/realtime-context";

const STATUS_OPTIONS: Array<{ label: string; value: JobSubmissionStatus }> = [
  { label: "New", value: "new" },
  { label: "Screening", value: "screening" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
];

const SOURCE_OPTIONS: Array<{ label: string; value: JobSubmissionSource }> = [
  { label: "ApplyAI", value: "applyai" },
  { label: "Gmail", value: "gmail" },
  { label: "LinkedIn email", value: "linkedin_email" },
  { label: "Indeed email", value: "indeed_email" },
  { label: "Other email", value: "other_email" },
];

const SOURCE_LABELS = Object.fromEntries(
  SOURCE_OPTIONS.map((source) => [source.value, source.label]),
) as Record<JobSubmissionSource, string>;

const STATUS_STYLE: Record<JobSubmissionStatus, string> = {
  new: "bg-[#eef5da] text-[#405b13]",
  screening: "bg-[#e7f0ee] text-[#235046]",
  interview: "bg-[#e7eff9] text-[#264f78]",
  offer: "bg-[#f5edcf] text-[#6c5310]",
  hired: "bg-[#dff1d9] text-[#285c21]",
  rejected: "bg-[#f5e5e1] text-[#8b3127]",
};

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSubmittedAt(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilterMenu({
  allLabel,
  label,
  onChange,
  options,
  value,
}: {
  allLabel?: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const menuOptions = allLabel
    ? [{ label: allLabel, value: "" }, ...options]
    : options;

  useEffect(() => {
    if (!open) {
      return;
    }

    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex h-10 max-w-[220px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${
          value
            ? "border-[#a9c878] bg-[#eff9d1] text-[#20332a]"
            : "border-[#d8d5c8] bg-white text-[#405047] hover:border-[#a9c878]"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <span aria-hidden="true" className={`text-xs transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-72 w-[min(280px,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-[#dedacd] bg-white p-1.5 shadow-[0_18px_45px_rgba(6,43,31,0.16)]"
          role="menu"
        >
          <p className="px-3 pb-1.5 pt-2 text-xs font-semibold text-[#657167]">
            {label}
          </p>
          {menuOptions.map((option) => {
            const selectedOption = option.value === value;

            return (
              <button
                aria-checked={selectedOption}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  selectedOption
                    ? "bg-[#e1edc5] text-[#20332a]"
                    : "text-[#405047] hover:bg-[#eff9d1] hover:text-[#062b1f]"
                }`}
                key={option.value || "all"}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                <span>{option.label}</span>
                {selectedOption ? <span aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function HrApplicantsPanel({
  companyId,
  jobId,
  submissionId,
}: {
  companyId?: number;
  jobId?: number;
  submissionId?: number;
}) {
  const { clearSession, token } = useAuth();
  const selectedIdRef = useRef<number | null>(submissionId ?? null);
  const jobsRef = useRef<HrJobOption[]>([]);
  const [jobs, setJobs] = useState<HrJobOption[]>([]);
  const [submissions, setSubmissions] = useState<JobSubmission[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState<JobSubmissionFilters>({
    job_id: jobId,
    sort: jobId ? "match_score" : "submitted_at",
    direction: "desc",
  });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusValue, setStatusValue] = useState<JobSubmissionStatus>("new");
  const [candidateMessage, setCandidateMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const selected = useMemo(
    () => submissions.find((submission) => submission.id === selectedId) ?? submissions[0] ?? null,
    [selectedId, submissions],
  );

  const load = useCallback(async (silent = false) => {
    if (!token) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const [submissionResponse, jobOptions] = await Promise.all([
        listHrSubmissions(token, filters, page),
        jobId
          ? Promise.resolve([])
          : jobsRef.current.length
          ? Promise.resolve(jobsRef.current)
          : listHrJobOptions(token),
      ]);
      setSubmissions(submissionResponse.data);
      setPagination(submissionResponse.meta);
      setJobs(jobOptions);
      jobsRef.current = jobOptions;
      const nextSelected =
        submissionResponse.data.find(
          (submission) => submission.id === selectedIdRef.current,
        ) ??
        submissionResponse.data[0] ??
        null;
      selectedIdRef.current = nextSelected?.id ?? null;
      setSelectedId(nextSelected?.id ?? null);
      setStatusValue(nextSelected?.status ?? "new");
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "We couldn't load applicants. Please try again.",
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [clearSession, filters, jobId, page, token]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  useCompanyRealtime(companyId, (payload) => {
    if (!jobId || payload.job_id === jobId) {
      void load(true);
    }
  });

  useEffect(() => {
    if (!submissions.some((submission) =>
      submission.match && ["pending", "processing"].includes(submission.match.status)
    )) {
      return;
    }

    const timer = window.setInterval(() => void load(true), 30_000);

    return () => window.clearInterval(timer);
  }, [load, submissions]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({
      ...current,
      q: query.trim() || undefined,
    }));
  }

  function updateFilter<Key extends keyof JobSubmissionFilters>(
    key: Key,
    value: JobSubmissionFilters[Key] | undefined,
  ) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function saveReview() {
    if (!token || !selected || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateHrSubmission(token, selected.id, {
        status: statusValue,
        candidate_message: candidateMessage.trim() || null,
      });

      if (filters.status && filters.status !== updated.status) {
        await load();
      } else {
        setSubmissions((current) =>
          current.map((submission) =>
            submission.id === updated.id ? updated : submission,
          ),
        );
      }
      setSuccess("Applicant review saved.");
      setCandidateMessage("");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We couldn't save this review. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function downloadDocument(
    submission: JobSubmission,
    document: JobSubmission["documents"][number],
  ) {
    if (!token || downloadingId !== null) {
      return;
    }

    setDownloadingId(document.id);
    setError("");

    try {
      const blob = await downloadHrSubmissionDocument(token, submission.id, document);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.original_filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We couldn't download this document.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function reanalyze(submission: JobSubmission) {
    if (!token) {
      return;
    }

    setError("");

    try {
      const updated = await reanalyzeHrSubmission(token, submission.id);
      setSubmissions((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We couldn't restart this match analysis.",
      );
    }
  }

  const activeFilterCount = [
    filters.q,
    jobId ? undefined : filters.job_id,
    filters.status,
    filters.source,
  ].filter(Boolean).length;

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Applicants</h2>
          <p className="mt-2 text-sm leading-6 text-[#657167]">
            Review every application and move candidates through your hiring process.
          </p>
        </div>
        <p className="text-sm font-semibold text-[#405047]">
          {pagination?.total ?? 0} {(pagination?.total ?? 0) === 1 ? "applicant" : "applicants"}
        </p>
      </div>

      <div className="mt-6 border-y border-[#e8e4d8] py-4">
        <form className="flex gap-2" onSubmit={submitSearch}>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search applicants</span>
            <input
              className="h-11 w-full rounded-xl border border-[#d8d5c8] bg-[#fbfaf4] px-4 text-sm text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applicant, email, or job title"
              value={query}
            />
          </label>
          <button
            className="h-11 rounded-xl bg-[#062b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#031a13] disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            Search
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {!jobId ? (
            <FilterMenu
              allLabel="All jobs"
              label="Job"
              onChange={(value) => updateFilter("job_id", value ? Number(value) : undefined)}
              options={jobs.map((job) => ({ label: job.title, value: String(job.id) }))}
              value={filters.job_id ? String(filters.job_id) : ""}
            />
          ) : null}
          <FilterMenu
            allLabel="All statuses"
            label="Status"
            onChange={(value) =>
              updateFilter("status", (value || undefined) as JobSubmissionStatus | undefined)
            }
            options={STATUS_OPTIONS}
            value={filters.status ?? ""}
          />
          <FilterMenu
            allLabel="All sources"
            label="Source"
            onChange={(value) =>
              updateFilter("source", (value || undefined) as JobSubmissionSource | undefined)
            }
            options={SOURCE_OPTIONS}
            value={filters.source ?? ""}
          />
          <FilterMenu
            label="Sort"
            onChange={(value) => {
              const sort = value === "score_asc" || value === "score_desc"
                ? "match_score"
                : "submitted_at";
              const direction = value.endsWith("_asc") ? "asc" : "desc";
              setPage(1);
              setFilters((current) => ({ ...current, sort, direction }));
            }}
            options={[
              { label: "Highest match", value: "score_desc" },
              { label: "Lowest match", value: "score_asc" },
              { label: "Newest applications", value: "date_desc" },
              { label: "Oldest applications", value: "date_asc" },
            ]}
            value={
              filters.sort === "match_score"
                ? `score_${filters.direction ?? "desc"}`
                : `date_${filters.direction ?? "desc"}`
            }
          />
          {activeFilterCount ? (
            <button
              className="h-10 rounded-full px-3 text-sm font-semibold text-[#8b281f] transition hover:bg-[#fff7f4]"
              onClick={() => {
                setFilters({
                  job_id: jobId,
                  sort: jobId ? "match_score" : "submitted_at",
                  direction: "desc",
                });
                setQuery("");
                setPage(1);
              }}
              type="button"
            >
              Clear {activeFilterCount}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm font-semibold text-[#8b281f]" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
        <div className="overflow-hidden rounded-[22px] border border-[#e1ded1]">
          <div className="flex items-center justify-between border-b border-[#e8e4d8] bg-[#fbfaf4] px-4 py-3">
            <p className="text-sm font-semibold">Applicant queue</p>
            <p className="text-xs font-semibold text-[#657167]">
              Page {pagination?.current_page ?? 1}
            </p>
          </div>
          <div className="max-h-[680px] divide-y divide-[#ece9df] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-3">
                <div className="h-28 animate-pulse rounded-2xl bg-[#eff3df]" />
                <div className="h-28 animate-pulse rounded-2xl bg-[#eff3df]" />
                <div className="h-28 animate-pulse rounded-2xl bg-[#eff3df]" />
              </div>
            ) : submissions.length ? (
              submissions.map((submission) => (
                <button
                  aria-pressed={selected?.id === submission.id}
                  className={`w-full p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#588100] ${
                    selected?.id === submission.id
                      ? "bg-[#eff9d1]"
                      : "bg-white hover:bg-[#fbfaf4]"
                  }`}
                  key={submission.id}
                  onClick={() => {
                    selectedIdRef.current = submission.id;
                    setSelectedId(submission.id);
                    setStatusValue(submission.status);
                    setCandidateMessage("");
                    setSuccess("");
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#062b1f]">
                        {submission.applicant_name}
                      </p>
                      <p className="mt-1 truncate text-sm text-[#657167]">
                        {submission.job.title}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {submission.match?.status === "completed" && submission.match.overall_score !== null ? (
                        <span className="rounded-full bg-[#062b1f] px-2.5 py-1 text-xs font-semibold text-white">
                          {submission.match.overall_score}% match
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1eeea] px-2.5 py-1 text-xs font-semibold text-[#657167]">
                          {submission.match ? formatLabel(submission.match.status) : "Not analyzed"}
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[submission.status]}`}>
                        {formatLabel(submission.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-[#657167]">
                    <span>{SOURCE_LABELS[submission.source]}</span>
                    <time dateTime={submission.submitted_at ?? undefined}>
                      {formatSubmittedAt(submission.submitted_at)}
                    </time>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="font-semibold">No applicants found</p>
                <p className="mt-2 text-sm leading-6 text-[#657167]">
                  Try a broader search or clear the active filters.
                </p>
              </div>
            )}
          </div>
          {pagination && pagination.last_page > 1 ? (
            <nav aria-label="Applicant pages" className="flex items-center justify-between border-t border-[#e8e4d8] bg-white p-3">
              <button
                className="h-9 rounded-full border border-[#d8d5c8] px-3 text-sm font-semibold transition hover:bg-[#eff9d1] disabled:opacity-40"
                disabled={loading || page === 1}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-[#657167]">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                className="h-9 rounded-full border border-[#d8d5c8] px-3 text-sm font-semibold transition hover:bg-[#eff9d1] disabled:opacity-40"
                disabled={loading || page === pagination.last_page}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          ) : null}
        </div>

        <div className="min-h-[560px] overflow-hidden rounded-[22px] border border-[#e1ded1] bg-white">
          {loading ? (
            <div className="h-full min-h-[560px] animate-pulse bg-[#eff3df]" />
          ) : selected ? (
            <>
              <header className="border-b border-[#e8e4d8] bg-[#f7f9ee] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#588100]">{selected.job.title}</p>
                    <h3 className="mt-1 text-2xl font-semibold">{selected.applicant_name}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#405047]">
                      <a className="font-medium hover:underline" href={`mailto:${selected.applicant_email}`}>
                        {selected.applicant_email}
                      </a>
                      {selected.applicant_phone ? <span>{selected.applicant_phone}</span> : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLE[selected.status]}`}>
                      {formatLabel(selected.status)}
                    </span>
                    <p className="mt-2 text-xs font-medium text-[#657167]">
                      {SOURCE_LABELS[selected.source]} · {formatSubmittedAt(selected.submitted_at)}
                    </p>
                  </div>
                </div>
              </header>

              <div className="space-y-7 p-5 sm:p-6">
                <section>
                  <h4 className="text-sm font-semibold">Hiring stage</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        aria-pressed={statusValue === status.value}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${
                          statusValue === status.value
                            ? "border-[#588100] bg-[#eff9d1] text-[#20332a]"
                            : "border-[#d8d5c8] text-[#657167] hover:border-[#a9c878] hover:text-[#20332a]"
                        }`}
                        key={status.value}
                        onClick={() => setStatusValue(status.value)}
                        type="button"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="border-y border-[#e8e4d8] py-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold">AI job match</h4>
                      <p className="mt-1 text-xs leading-5 text-[#657167]">
                        Decision support based only on resume evidence and this job posting.
                      </p>
                    </div>
                    {selected.match?.status === "completed" && selected.match.overall_score !== null ? (
                      <div className="text-right">
                        <p className="text-3xl font-semibold text-[#062b1f]">{selected.match.overall_score}%</p>
                        <p className="text-xs font-semibold text-[#657167]">Overall match</p>
                      </div>
                    ) : null}
                  </div>

                  {selected.match?.status === "completed" ? (
                    <>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#f7f9ee] p-4">
                          <p className="text-xs font-semibold text-[#657167]">Skills</p>
                          <p className="mt-1 text-xl font-semibold">{selected.match.skills_score}%</p>
                        </div>
                        <div className="rounded-xl bg-[#f7f9ee] p-4">
                          <p className="text-xs font-semibold text-[#657167]">Experience</p>
                          <p className="mt-1 text-xl font-semibold">{selected.match.experience_score}%</p>
                        </div>
                      </div>
                      {selected.match.summary ? (
                        <p className="mt-5 text-sm leading-7 text-[#405047]">{selected.match.summary}</p>
                      ) : null}
                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                          <h5 className="text-sm font-semibold text-[#315000]">Matched requirements</h5>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#405047]">
                            {(selected.match.matched_requirements ?? []).map((item) => <li key={item}>✓ {item}</li>)}
                            {!selected.match.matched_requirements?.length ? <li>No explicit matches returned.</li> : null}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-[#8b3127]">Missing or unclear</h5>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#405047]">
                            {(selected.match.missing_requirements ?? []).map((item) => <li key={item}>– {item}</li>)}
                            {!selected.match.missing_requirements?.length ? <li>No material gaps identified.</li> : null}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : selected.match?.status === "failed" ? (
                    <div className="mt-5 rounded-xl border border-[#efc8bf] bg-[#fff7f4] p-4">
                      <p className="text-sm font-semibold text-[#8b3127]">Match analysis failed</p>
                      <p className="mt-1 text-sm text-[#657167]">{selected.match.error_message ?? "The AI service did not complete this analysis."}</p>
                      <button className="mt-3 text-sm font-semibold text-[#8b3127] underline underline-offset-4" onClick={() => void reanalyze(selected)} type="button">Retry analysis</button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl bg-[#f7f9ee] p-4 text-sm font-medium text-[#405047]">
                      {selected.match ? "Analyzing this resume against the job requirements..." : "No match analysis is available for this application."}
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="text-sm font-semibold">Documents</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.documents.length ? (
                      selected.documents.map((document) => (
                        <button
                          className="inline-flex items-center gap-3 rounded-xl border border-[#d8d5c8] bg-[#fbfaf4] px-3 py-2.5 text-left transition hover:border-[#a9c878] hover:bg-[#eff9d1] disabled:opacity-50"
                          disabled={downloadingId !== null}
                          key={document.id}
                          onClick={() => void downloadDocument(selected, document)}
                          type="button"
                        >
                          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-white text-[#588100]">
                            ↓
                          </span>
                          <span>
                            <span className="block max-w-52 truncate text-sm font-semibold">
                              {document.original_filename}
                            </span>
                            <span className="block text-xs text-[#657167]">
                              {downloadingId === document.id ? "Downloading..." : formatFileSize(document.file_size)}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-[#657167]">No documents attached.</p>
                    )}
                  </div>
                </section>

                {selected.cover_letter ? (
                  <section>
                    <h4 className="text-sm font-semibold">Cover letter</h4>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#405047]">
                      {selected.cover_letter}
                    </p>
                  </section>
                ) : null}

                <section className="border-t border-[#e8e4d8] pt-6">
                  <label className="text-sm font-semibold" htmlFor="candidate-message">
                    Message candidate
                  </label>
                  {selected.candidate_user_id ? (
                    <>
                      <p className="mt-1 text-xs leading-5 text-[#657167]">
                        Include an optional visible message with this review. The candidate receives one notification containing the new status and your message.
                      </p>
                      <textarea
                        className="mt-3 min-h-24 w-full rounded-xl border border-[#d8d5c8] bg-[#fbfaf4] p-3 text-sm leading-6 outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20"
                        id="candidate-message"
                        maxLength={5000}
                        onChange={(event) => setCandidateMessage(event.target.value)}
                        placeholder="For example: We would like to invite you to an interview on..."
                        value={candidateMessage}
                      />
                    </>
                  ) : (
                    <p className="mt-2 rounded-xl bg-[#f4f2ea] p-3 text-xs leading-5 text-[#657167]">
                      This applicant is external and does not have an ApplyAI account for in-app messages.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      className="h-10 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        saving ||
                        (statusValue === selected.status && !candidateMessage.trim())
                      }
                      onClick={() => void saveReview()}
                      type="button"
                    >
                      {saving ? "Saving..." : "Save review"}
                    </button>
                    {success ? (
                      <p className="text-sm font-semibold text-[#3f5e00]" role="status">
                        {success}
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="grid min-h-[560px] place-items-center p-8 text-center">
              <div>
                <h3 className="font-semibold">Select an applicant</h3>
                <p className="mt-2 text-sm leading-6 text-[#657167]">
                  Candidate details and review controls will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
