"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  applyToJob,
  isUnauthorizedError,
  listCandidateJobs,
  listPublicJobs,
  type EmploymentType,
  type HrJob,
  type JobApplicationState,
  type JobSearchFilters,
  type WorkMode,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

type FilterDraft = {
  q: string;
  skill: string;
  employment_type: EmploymentType | "";
  work_mode: WorkMode | "";
  experience_level: ExperienceLevel | "";
  application_state: JobApplicationState | "";
};

const EMPTY_FILTERS: FilterDraft = {
  q: "",
  skill: "",
  employment_type: "",
  work_mode: "",
  experience_level: "",
  application_state: "",
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

function toSearchFilters(draft: FilterDraft): JobSearchFilters {
  return {
    q: draft.q.trim() || undefined,
    skill: draft.skill.trim() || undefined,
    employment_type: draft.employment_type || undefined,
    work_mode: draft.work_mode || undefined,
    experience_level: draft.experience_level || undefined,
    application_state: draft.application_state || undefined,
  };
}

function formatValue(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        className={`h-10 appearance-none rounded-full border py-0 pl-4 pr-9 text-sm font-semibold outline-none transition focus:border-[#588100] focus:ring-4 focus:ring-[#a6f20f]/20 ${
          value
            ? "border-[#a9c878] bg-[#eff9d1] text-[#20332a]"
            : "border-[#d8d5c8] bg-white text-[#405047] hover:border-[#b7b29f]"
        }`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#657167]"
      >
        ▾
      </span>
    </label>
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

export function JobsView({ publicMode = false }: { publicMode?: boolean }) {
  const { clearSession, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<JobSearchFilters>({});
  const [matchPreferences, setMatchPreferences] = useState(false);
  const [activeMatchPreferences, setActiveMatchPreferences] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const selectedId = Number(searchParams.get("selected"));
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId],
  );
  const isCandidate = user?.account_type === "candidate";
  const useCandidateJobs = !publicMode || isCandidate;

  const activeFilterCount =
    Object.values(activeFilters).filter(Boolean).length +
    (activeMatchPreferences ? 1 : 0);

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
      const nextJobs = useCandidateJobs
        ? await listCandidateJobs(
            token as string,
            activeFilters,
            activeMatchPreferences,
          )
        : await listPublicJobs(activeFilters);

      setJobs(nextJobs);
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
    activeMatchPreferences,
    clearSession,
    publicMode,
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
    setActiveFilters(toSearchFilters(draftFilters));
    setActiveMatchPreferences(matchPreferences);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setActiveFilters({});
    setMatchPreferences(false);
    setActiveMatchPreferences(false);
  }

  async function apply() {
    if (!selectedJob || applyingId !== null || selectedJob.application_status) {
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

    setApplyingId(selectedJob.id);
    setError("");

    try {
      const updatedJob = await applyToJob(token, selectedJob.id);
      setJobs((current) => {
        if (activeFilters.application_state === "not_applied") {
          return current.filter((job) => job.id !== updatedJob.id);
        }

        return current.map((job) =>
          job.id === updatedJob.id ? updatedJob : job,
        );
      });
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "We couldn't submit your application. Please try again.",
        );
      }
    } finally {
      setApplyingId(null);
    }
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
          {!publicMode ? (
            <FilterSelect
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
          {!publicMode ? (
            <label
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                matchPreferences
                  ? "border-[#a9c878] bg-[#eff9d1] text-[#20332a]"
                  : "border-[#d8d5c8] bg-white text-[#405047]"
              }`}
            >
              <input
                checked={matchPreferences}
                className="accent-[#588100]"
                onChange={(event) => setMatchPreferences(event.target.checked)}
                type="checkbox"
              />
              Match my preferences
            </label>
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
        <section
          aria-label="Job results"
          className="rounded-[24px] border border-[#e1ded1] bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-sm font-semibold text-[#20332a]" aria-live="polite">
              {isLoading
                ? "Searching roles"
                : `${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}`}
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
                  onClick={() => selectJob(job.id)}
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
                      disabled={
                        applyingId !== null ||
                        Boolean(selectedJob.application_status)
                      }
                      onClick={() => void apply()}
                      type="button"
                    >
                      {applyingId === selectedJob.id
                        ? "Applying..."
                        : selectedJob.application_status
                          ? formatValue(selectedJob.application_status)
                          : !token
                            ? "Sign in to apply"
                            : "Apply"}
                    </button>
                  </div>
                </div>
              </header>

              <div className="max-h-[520px] overflow-y-auto p-6 sm:p-8">
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
