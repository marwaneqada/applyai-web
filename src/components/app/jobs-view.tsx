"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  isUnauthorizedError,
  listCandidateJobs,
  listPublicJobs,
  type EmploymentType,
  type HrJob,
  type JobApplicationState,
  type JobSearchFilters,
  type PaginationMeta,
  type PostedWithinDays,
  type WorkMode,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { JobApplicationPanel } from "@/components/app/job-application-panel";

type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

type FilterDraft = {
  q: string;
  skill: string;
  employment_type: EmploymentType | "";
  work_mode: WorkMode | "";
  experience_level: ExperienceLevel | "";
  application_state: JobApplicationState | "";
  posted_within_days: PostedWithinDays | "";
};

const EMPTY_FILTERS: FilterDraft = {
  q: "",
  skill: "",
  employment_type: "",
  work_mode: "",
  experience_level: "",
  application_state: "",
  posted_within_days: "",
};

const EMPLOYMENT_OPTIONS: Array<{ label: string; value: EmploymentType }> = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const WORK_MODE_OPTIONS: Array<{ label: string; value: WorkMode }> = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "on_site" },
];

const EXPERIENCE_OPTIONS: Array<{ label: string; value: ExperienceLevel }> = [
  { label: "Junior", value: "junior" },
  { label: "Mid-level", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Lead", value: "lead" },
];

const POSTED_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Past 24 hours", value: "1" },
  { label: "Past 3 days", value: "3" },
  { label: "Past week", value: "7" },
  { label: "Past 2 weeks", value: "14" },
  { label: "Past month", value: "30" },
];

function toSearchFilters(draft: FilterDraft): JobSearchFilters {
  return {
    q: draft.q.trim() || undefined,
    skill: draft.skill.trim() || undefined,
    employment_type: draft.employment_type || undefined,
    work_mode: draft.work_mode || undefined,
    experience_level: draft.experience_level || undefined,
    application_state: draft.application_state || undefined,
    posted_within_days: draft.posted_within_days || undefined,
  };
}

function formatValue(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FilterSelect({
  allLabel,
  label,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const menuOptions = [{ label: allLabel, value: "" }, ...options];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePress(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function focusOption(index: number) {
    const normalizedIndex =
      (index + menuOptions.length) % menuOptions.length;
    optionRefs.current[normalizedIndex]?.focus();
  }

  function openAndFocus(index: number) {
    setIsOpen(true);
    window.requestAnimationFrame(() => focusOption(index));
  }

  function selectedIndex() {
    const index = menuOptions.findIndex((option) => option.value === value);
    return index < 0 ? 0 : index;
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openAndFocus(selectedIndex());
    }
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(menuOptions.length - 1);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${label}: ${selectedOption?.label ?? allLabel}`}
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-[#a6f20f]/20 ${
          value
            ? "border-[#a9c878] bg-[#eff9d1] text-[#20332a]"
            : "border-[#d8d5c8] bg-white text-[#405047] hover:border-[#b7b29f]"
        }`}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span>{selectedOption?.label ?? label}</span>
        <svg
          aria-hidden="true"
          className={`size-4 text-[#657167] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          aria-label={label}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl border border-[#dedacd] bg-white p-1.5 shadow-[0_18px_45px_rgba(6,43,31,0.16)]"
          role="menu"
        >
          <p className="px-3 pb-1.5 pt-2 text-xs font-semibold text-[#657167]">
            {label}
          </p>
          {menuOptions.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-checked={isSelected}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#588100] ${
                  isSelected
                    ? "bg-[#e1edc5] text-[#20332a] hover:bg-[#d5e5b2]"
                    : "text-[#405047] hover:bg-[#eff9d1] hover:text-[#062b1f] focus-visible:bg-[#eff9d1]"
                }`}
                key={option.value || "all"}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="menuitemradio"
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[#588100]"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    viewBox="0 0 24 24"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function JobAttribute({ value }: { value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <span className="rounded-full bg-[#eff3df] px-3 py-1 text-xs font-semibold text-[#405047]">
      {formatValue(value)}
    </span>
  );
}

function formatPostedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const postedAt = new Date(value);

  if (Number.isNaN(postedAt.getTime())) {
    return null;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - postedAt.getTime()) / 1000),
  );

  if (elapsedSeconds < 60) {
    return "Posted just now";
  }

  const units: Array<{
    seconds: number;
    unit: Intl.RelativeTimeFormatUnit;
  }> = [
    { seconds: 2_592_000, unit: "month" },
    { seconds: 604_800, unit: "week" },
    { seconds: 86_400, unit: "day" },
    { seconds: 3_600, unit: "hour" },
    { seconds: 60, unit: "minute" },
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const match = units.find((candidate) => elapsedSeconds >= candidate.seconds);

  if (!match) {
    return "Posted just now";
  }

  return `Posted ${formatter.format(
    -Math.floor(elapsedSeconds / match.seconds),
    match.unit,
  )}`;
}

function Pagination({
  isLoading,
  meta,
  onPageChange,
}: {
  isLoading: boolean;
  meta: PaginationMeta | null;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Job results pages"
      className="flex items-center justify-between gap-3 border-t border-[#ece9df] px-3 pb-1 pt-4"
    >
      <button
        className="inline-flex h-9 items-center rounded-full border border-[#d8d5c8] bg-white px-3 text-sm font-semibold text-[#405047] transition hover:border-[#a9c878] hover:bg-[#eff9d1] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={isLoading || meta.current_page === 1}
        onClick={() => onPageChange(meta.current_page - 1)}
        type="button"
      >
        Previous
      </button>
      <span className="text-xs font-semibold text-[#657167]" aria-live="polite">
        Page {meta.current_page} of {meta.last_page}
      </span>
      <button
        className="inline-flex h-9 items-center rounded-full border border-[#d8d5c8] bg-white px-3 text-sm font-semibold text-[#405047] transition hover:border-[#a9c878] hover:bg-[#eff9d1] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={isLoading || meta.current_page === meta.last_page}
        onClick={() => onPageChange(meta.current_page + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}

export function JobsView({ publicMode = false }: { publicMode?: boolean }) {
  const { clearSession, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<JobSearchFilters>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [applicationJobId, setApplicationJobId] = useState<number | null>(null);

  const selectedId = Number(searchParams.get("selected"));
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId],
  );
  const isCandidate = user?.account_type === "candidate";
  const useCandidateJobs = !publicMode || isCandidate;

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  const selectJob = useCallback(
    (id: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("selected", String(id));
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    if (!token && !publicMode) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = useCandidateJobs
        ? await listCandidateJobs(token as string, activeFilters, page)
        : await listPublicJobs(activeFilters, page);

      setJobs(response.data);
      setPagination(response.meta);
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "We couldn't load jobs. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    activeFilters,
    clearSession,
    publicMode,
    page,
    token,
    useCandidateJobs,
  ]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (jobs.length > 0 && !jobs.some((job) => job.id === selectedId)) {
      selectJob(jobs[0].id);
    }
  }, [isLoading, jobs, selectJob, selectedId]);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setActiveFilters(toSearchFilters(draftFilters));
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setPage(1);
    setActiveFilters({});
  }

  function chooseJob(id: number) {
    setApplicationJobId(null);
    setSuccessMessage("");
    selectJob(id);
  }

  function openApplication() {
    if (!selectedJob || selectedJob.application_status) {
      return;
    }

    if (!token) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `${pathname}?selected=${selectedJob.id}`,
        )}`,
      );
      return;
    }

    if (!isCandidate) {
      setError("A Candidate account is required to apply for jobs.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setApplicationJobId(selectedJob.id);
  }

  function applied(updatedJob: HrJob) {
    setJobs((current) => {
      if (activeFilters.application_state === "not_applied") {
        return current.filter((job) => job.id !== updatedJob.id);
      }

      return current.map((job) =>
        job.id === updatedJob.id ? updatedJob : job,
      );
    });
    setApplicationJobId(null);
    setSuccessMessage(
      `Application sent to ${updatedJob.company_name ?? "the hiring team"}.`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-[#062b1f]">Find jobs</h1>
        <p className="mt-2 text-sm leading-6 text-[#657167]">
          Search open roles, refine the list, and review the full opportunity
          without leaving the page.
        </p>
      </header>

      <form
        className="mt-6 rounded-[24px] border border-[#e1ded1] bg-white p-4 shadow-sm sm:p-5"
        data-tour="jobs-search"
        onSubmit={submitFilters}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.8fr)_auto]">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#405047]">
              Keyword or location
            </span>
            <input
              className="h-11 w-full rounded-xl border border-[#d8d5c8] bg-[#fbfaf4] px-4 text-sm text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              placeholder="Job title, company, or city"
              value={draftFilters.q}
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#405047]">
              Skill
            </span>
            <input
              className="h-11 w-full rounded-xl border border-[#d8d5c8] bg-[#fbfaf4] px-4 text-sm text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  skill: event.target.value,
                }))
              }
              placeholder="Laravel, React, Docker..."
              value={draftFilters.skill}
            />
          </label>

          <button
            className="h-11 self-end rounded-xl bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_12px_28px_rgba(6,43,31,0.16)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Searching..." : "Search jobs"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#ece9df] pt-4">
          <FilterSelect
            allLabel="Any employment type"
            label="Employment type"
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                employment_type: value as EmploymentType | "",
              }))
            }
            options={EMPLOYMENT_OPTIONS}
            value={draftFilters.employment_type}
          />
          <FilterSelect
            allLabel="Any work mode"
            label="Work mode"
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                work_mode: value as WorkMode | "",
              }))
            }
            options={WORK_MODE_OPTIONS}
            value={draftFilters.work_mode}
          />
          <FilterSelect
            allLabel="Any experience level"
            label="Experience"
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                experience_level: value as ExperienceLevel | "",
              }))
            }
            options={EXPERIENCE_OPTIONS}
            value={draftFilters.experience_level}
          />
          <FilterSelect
            allLabel="Any posting date"
            label="Date posted"
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                posted_within_days: value
                  ? (Number(value) as PostedWithinDays)
                  : "",
              }))
            }
            options={POSTED_OPTIONS}
            value={
              draftFilters.posted_within_days
                ? String(draftFilters.posted_within_days)
                : ""
            }
          />
          {!publicMode ? (
            <FilterSelect
              allLabel="Any application status"
              label="Application"
              onChange={(value) =>
                setDraftFilters((current) => ({
                  ...current,
                  application_state: value as JobApplicationState | "",
                }))
              }
              options={[
                { label: "Already applied", value: "applied" },
                { label: "Not applied", value: "not_applied" },
              ]}
              value={draftFilters.application_state}
            />
          ) : null}
          {activeFilterCount > 0 ? (
            <button
              className="h-10 rounded-full px-3 text-sm font-semibold text-[#8b281f] transition hover:bg-[#fff7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={clearFilters}
              type="button"
            >
              Clear {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "filter" : "filters"}
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div
          className="mt-5 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm font-semibold text-[#9f2f22]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="mt-5 flex items-start gap-3 rounded-2xl border border-[#cfe39b] bg-[#f2fbdc] p-4 text-sm text-[#315000]"
          role="status"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#588100] text-xs font-bold text-white"
          >
            ✓
          </span>
          <div>
            <p className="font-semibold">Application submitted</p>
            <p className="mt-0.5 leading-6">{successMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
        <section
          aria-label="Job results"
          className="rounded-[24px] border border-[#e1ded1] bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-sm font-semibold text-[#20332a]" aria-live="polite">
              {isLoading
                ? "Searching roles"
                : `${pagination?.total ?? jobs.length} open ${
                    (pagination?.total ?? jobs.length) === 1 ? "role" : "roles"
                  }`}
            </h2>
            <span className="text-xs font-medium text-[#657167]">
              Select a role
            </span>
          </div>

          <div className="max-h-[660px] space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <>
                <div className="h-36 animate-pulse rounded-2xl bg-[#eff3df]" />
                <div className="h-36 animate-pulse rounded-2xl bg-[#eff3df]" />
                <div className="h-36 animate-pulse rounded-2xl bg-[#eff3df]" />
              </>
            ) : (
              jobs.map((job) => (
                <button
                  aria-pressed={selectedJob?.id === job.id}
                  className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${
                    selectedJob?.id === job.id
                      ? "border-[#588100] bg-[#eff9d1]"
                      : "border-transparent hover:border-[#d8d5c8] hover:bg-[#fbfaf4]"
                  }`}
                  key={job.id}
                  onClick={() => chooseJob(job.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#588100]">
                        {job.company_name}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-[#062b1f]">
                        {job.title}
                      </h3>
                    </div>
                    {job.application_status ? (
                      <span className="shrink-0 rounded-full bg-[#dcefb0] px-2.5 py-1 text-xs font-semibold text-[#315000]">
                        {formatValue(job.application_status)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#657167]">
                    {job.location || "Location not specified"}
                  </p>
                  {formatPostedAt(job.created_at) ? (
                    <time
                      className="mt-1 block text-xs font-semibold text-[#657167]"
                      dateTime={job.created_at ?? undefined}
                      title={
                        job.created_at
                          ? new Date(job.created_at).toLocaleString()
                          : undefined
                      }
                    >
                      {formatPostedAt(job.created_at)}
                    </time>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <JobAttribute value={job.employment_type} />
                    <JobAttribute value={job.work_mode} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#405047]">
                    {job.summary ||
                      "Open this role to read the full description."}
                  </p>
                </button>
              ))
            )}

            {!isLoading && jobs.length === 0 ? (
              <div className="p-6 text-center">
                <h3 className="text-sm font-semibold text-[#062b1f]">
                  No matching jobs
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#657167]">
                  Try removing a filter or searching for a broader skill.
                </p>
                {activeFilterCount > 0 ? (
                  <button
                    className="mt-3 text-sm font-semibold text-[#588100] underline underline-offset-4"
                    onClick={clearFilters}
                    type="button"
                  >
                    Clear all filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <Pagination
            isLoading={isLoading}
            meta={pagination}
            onPageChange={(nextPage) => {
              setApplicationJobId(null);
              setSuccessMessage("");
              setPage(nextPage);
            }}
          />
        </section>

        <section className="min-h-[520px] overflow-hidden rounded-[24px] border border-[#e1ded1] bg-white shadow-sm">
          {isLoading ? (
            <div className="h-full min-h-[520px] animate-pulse bg-[#eff3df]" />
          ) : selectedJob ? (
            <>
              <header className="border-b border-[#e8e4d8] bg-[#f7f9ee] p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#588100]">
                      {selectedJob.company_name}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#062b1f]">
                      {selectedJob.title}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-[#405047]">
                      {selectedJob.location || "Location not specified"}
                    </p>
                    {formatPostedAt(selectedJob.created_at) ? (
                      <time
                        className="mt-2 block text-xs font-semibold text-[#657167]"
                        dateTime={selectedJob.created_at ?? undefined}
                        title={
                          selectedJob.created_at
                            ? new Date(selectedJob.created_at).toLocaleString()
                            : undefined
                        }
                      >
                        {formatPostedAt(selectedJob.created_at)}
                      </time>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <JobAttribute value={selectedJob.employment_type} />
                      <JobAttribute value={selectedJob.work_mode} />
                      <JobAttribute value={selectedJob.experience_level} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#e9f6c8] px-3 py-1.5 text-xs font-semibold text-[#3f5e00]">
                      Open until {selectedJob.closes_at}
                    </span>
                    <button
                      className="h-10 rounded-full bg-[#062b1f] px-4 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                      disabled={Boolean(selectedJob.application_status)}
                      onClick={openApplication}
                      type="button"
                    >
                      {selectedJob.application_status
                        ? formatValue(selectedJob.application_status)
                        : !token
                          ? "Sign in to apply"
                          : applicationJobId === selectedJob.id
                            ? "Application open"
                            : "Apply"}
                    </button>
                  </div>
                </div>
              </header>

              <div className="max-h-[520px] overflow-y-auto p-6 sm:p-8">
                {applicationJobId === selectedJob.id ? (
                  <JobApplicationPanel
                    job={selectedJob}
                    onApplied={applied}
                    onCancel={() => setApplicationJobId(null)}
                  />
                ) : null}

                {selectedJob.summary ? (
                  <p className="text-base leading-7 text-[#405047]">
                    {selectedJob.summary}
                  </p>
                ) : null}

                <div className="my-7 h-px bg-[#e8e4d8]" />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#062b1f]">
                      Required skills
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedJob.required_skills?.length ? (
                        selectedJob.required_skills.map((skill) => (
                          <span
                            className="rounded-full bg-[#e9f6c8] px-3 py-1 text-sm font-semibold text-[#20332a]"
                            key={skill}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-[#657167]">Not specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#062b1f]">
                      Preferred skills
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedJob.preferred_skills?.length ? (
                        selectedJob.preferred_skills.map((skill) => (
                          <span
                            className="rounded-full border border-[#d8d5c8] px-3 py-1 text-sm font-semibold text-[#405047]"
                            key={skill}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-[#657167]">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-7 h-px bg-[#e8e4d8]" />

                <h3 className="text-lg font-semibold text-[#062b1f]">
                  Full job description
                </h3>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#405047]">
                  {selectedJob.description}
                </p>
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold text-[#062b1f]">
                  Select a job to view details
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#657167]">
                  Open roles will appear here when your search returns results.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
