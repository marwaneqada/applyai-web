"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, createHrJob, deleteHrJob, isUnauthorizedError, listHrJobs, updateHrJob, type HrJob, type JobStatus, type PaginationMeta } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const emptyJob = { title: "", summary: "", description: "", requiredSkills: [] as string[], preferredSkills: [] as string[], location: "", experience_level: "", work_mode: "", employment_type: "", status: "draft" as JobStatus, opens_at: "", closes_at: "" };
const applicationWindowError = "Set a valid application window before publishing this job.";
const statusStyle: Record<JobStatus, string> = {
  draft: "bg-[#eff3df] text-[#405047]",
  open: "bg-[#e9f6c8] text-[#3f5e00]",
  closed: "bg-[#f1eeea] text-[#657167]",
};
const jobFilters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
] as const;

type JobCounts = Record<"all" | JobStatus, number>;

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function JobActionsMenu({
  job,
  onClose,
  onDelete,
}: {
  job: HrJob;
  onClose: (job: HrJob) => void;
  onDelete: (job: HrJob) => void;
}) {
  const rootRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        rootRef.current?.removeAttribute("open");
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        rootRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details className="group relative" ref={rootRef}>
      <summary
        aria-label={`More actions for ${job.title}`}
        className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-transparent text-[#657167] transition hover:border-[#d7ddd5] hover:bg-[#f7f8f5] hover:text-[#20332a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </summary>
      <div className="absolute right-0 top-11 z-10 w-44 rounded-xl border border-[#d7ddd5] bg-white p-1.5 shadow-[0_12px_32px_rgba(17,44,35,0.12)]">
        {job.status !== "closed" ? (
          <button
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#405047] transition hover:bg-[#f1f3ef] hover:text-[#20332a]"
            onClick={() => {
              rootRef.current?.removeAttribute("open");
              onClose(job);
            }}
            type="button"
          >
            Close job
          </button>
        ) : null}
        <button
          className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#a2382b] transition hover:bg-[#fff6f3]"
          onClick={() => {
            rootRef.current?.removeAttribute("open");
            onDelete(job);
          }}
          type="button"
        >
          Delete job
        </button>
      </div>
    </details>
  );
}

function JobList({
  editingId,
  error,
  jobs,
  onClose,
  onDelete,
  onEdit,
  statusFilter,
}: {
  editingId: number | null;
  error: string;
  jobs: HrJob[];
  onClose: (job: HrJob) => void;
  onDelete: (job: HrJob) => void;
  onEdit: (job: HrJob) => void;
  statusFilter: "all" | JobStatus;
}) {
  const visibleJobs = jobs.filter((job) => job.id !== editingId);

  if (!visibleJobs.length && !error) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-[#cfd6cc] bg-white px-5 py-10 text-center">
        <h3 className="text-sm font-semibold text-[#20332a]">
          {statusFilter === "all" ? "No job posts yet" : `No ${statusFilter} jobs`}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#6a756d]">
          {statusFilter === "all"
            ? "Create your first role when you are ready to start hiring."
            : "Try another filter or create a new role."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-2.5">
      {visibleJobs.map((job) => {
        const skills = job.required_skills ?? [];

        return (
          <article className="rounded-xl border border-[#dde2db] bg-white p-4 transition hover:border-[#c5cdc2] sm:p-5" key={job.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[#112c23]">{job.title}</h3>
                <p className="mt-1 text-sm text-[#6a756d]">{job.location || "Location not set"}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[job.status]}`}>
                {job.accepting_applications ? "Open" : job.status}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-[#526059]">
              {job.summary || job.description}
            </p>

            {skills.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Required skills">
                {skills.slice(0, 3).map((skill) => (
                  <span className="rounded-md bg-[#f0f3ee] px-2 py-1 text-xs font-medium text-[#526059]" key={skill}>
                    {skill}
                  </span>
                ))}
                {skills.length > 3 ? (
                  <span className="text-xs font-medium text-[#7a847d]">+{skills.length - 3} more</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 border-t border-[#edf0ec] pt-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6a756d]">
                <span>
                  <strong className="font-semibold text-[#405047]">Window:</strong>{" "}
                  {formatDate(job.opens_at)} – {formatDate(job.closes_at)}
                </span>
                <span>
                  <strong className="font-semibold tabular-nums text-[#405047]">{job.submissions_count ?? 0}</strong>{" "}
                  {(job.submissions_count ?? 0) === 1 ? "applicant" : "applicants"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0b3b2c] px-3.5 text-sm font-semibold text-white transition hover:bg-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]" href={`/hr/jobs/${job.id}`}>
                  View applicants
                </Link>
                <button className="h-9 rounded-lg border border-[#d7ddd5] bg-white px-3.5 text-sm font-semibold text-[#405047] transition hover:border-[#b9c1b7] hover:bg-[#f7f8f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]" onClick={() => onEdit(job)} type="button">
                  Edit
                </button>
                <JobActionsMenu job={job} onClose={onClose} onDelete={onDelete} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SkillTags({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add() { const skill = draft.trim(); if (skill && !values.some((value) => value.toLowerCase() === skill.toLowerCase()) && values.length < 20) onChange([...values, skill]); setDraft(""); }
  return <div><span className="text-sm font-semibold">{label}</span><div className="mt-2 rounded-xl border border-[#d8d5c8] bg-white p-2 focus-within:border-[#588100] focus-within:ring-4 focus-within:ring-[#a6f20f]/20">{values.length ? <div className="flex flex-wrap gap-2">{values.map((skill) => <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f6c8] py-1 pl-3 pr-1 text-sm font-semibold text-[#20332a]" key={skill}>{skill}<button aria-label={`Remove ${skill}`} className="grid size-6 place-items-center rounded-full hover:bg-[#d5eca1]" onClick={() => onChange(values.filter((value) => value !== skill))} type="button">×</button></span>)}</div> : null}<div className={`flex gap-2 ${values.length ? "mt-2" : ""}`}><input className="h-9 min-w-0 flex-1 px-2 text-sm outline-none" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Type a skill" value={draft}/><button className="rounded-full bg-[#eff3df] px-3 text-sm font-semibold" disabled={!draft.trim()} onClick={add} type="button">Add</button></div></div><span className="mt-1 block text-xs font-medium text-[#657167]">Type one skill at a time, then press Enter or Add.</span></div>;
}

export function HrJobsPanel() {
  const { clearSession, token } = useAuth();
  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [values, setValues] = useState(emptyJob);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadJobCounts = useCallback(async () => {
    if (!token) return;

    try {
      const [
        allJobs,
        openJobs,
        draftJobs,
        closedJobs,
      ] = await Promise.all([
        listHrJobs(token, 1, 1),
        listHrJobs(token, 1, 1, "open"),
        listHrJobs(token, 1, 1, "draft"),
        listHrJobs(token, 1, 1, "closed"),
      ]);

      setJobCounts({
        all: allJobs.meta.total,
        open: openJobs.meta.total,
        draft: draftJobs.meta.total,
        closed: closedJobs.meta.total,
      });
    } catch (cause) {
      if (isUnauthorizedError(cause)) clearSession();
    }
  }, [clearSession, token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await listHrJobs(
        token,
        page,
        10,
        statusFilter === "all" ? undefined : statusFilter,
      );
      setJobs(response.data);
      setPagination(response.meta);
      setError("");
    }
    catch (cause) { if (isUnauthorizedError(cause)) clearSession(); else setError(cause instanceof ApiError ? cause.message : "We couldn't load jobs."); }
  }, [clearSession, page, statusFilter, token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { void Promise.resolve().then(loadJobCounts); }, [loadJobCounts]);

  function updateDate(field: "opens_at" | "closes_at", value: string) {
    const nextOpensAt = field === "opens_at" ? value : values.opens_at;
    const nextClosesAt = field === "closes_at" ? value : values.closes_at;

    setValues({...values, [field]: value});
    setFieldErrors((current) => {
      const next = {...current};
      delete next[field];

      if (nextOpensAt && nextClosesAt) {
        if (nextClosesAt < nextOpensAt) {
          next.closes_at = "Choose a closing date on or after the opening date.";
        } else {
          delete next.opens_at;
          delete next.closes_at;
        }
      }

      return next;
    });

    if (nextOpensAt && nextClosesAt && nextClosesAt >= nextOpensAt) {
      setFormError((current) =>
        current === applicationWindowError ? "" : current,
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving) return;

    const nextFieldErrors: Record<string, string> = {};
    if (values.status === "open" && !values.opens_at) {
      nextFieldErrors.opens_at = "Choose when applications open before publishing this job.";
    }
    if (values.status === "open" && !values.closes_at) {
      nextFieldErrors.closes_at = "Choose when applications close before publishing this job.";
    }
    if (values.opens_at && values.closes_at && values.closes_at < values.opens_at) {
      nextFieldErrors.closes_at = "Choose a closing date on or after the opening date.";
    }
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setFormError(applicationWindowError);
      return;
    }

    setSaving(true); setError(""); setFormError(""); setFieldErrors({});
    try {
      const payload = {
        ...values,
        required_skills: values.requiredSkills,
        preferred_skills: values.preferredSkills,
        location: values.location || null,
        experience_level: values.experience_level || null,
        work_mode: values.work_mode || null,
        employment_type: values.employment_type || null,
        opens_at: values.opens_at || null,
        closes_at: values.closes_at || null,
      };
      delete (payload as { requiredSkills?: string[] }).requiredSkills;
      delete (payload as { preferredSkills?: string[] }).preferredSkills;
      if (editingId) {
        await updateHrJob(token, editingId, payload);
        await Promise.all([load(), loadJobCounts()]);
      } else if (page === 1) {
        await createHrJob(token, payload);
        await Promise.all([load(), loadJobCounts()]);
      } else {
        await createHrJob(token, payload);
        setPage(1);
        await loadJobCounts();
      }
      setValues(emptyJob); setEditingId(null); setShowForm(false);
    } catch (cause) {
      if (cause instanceof ApiError && Object.keys(cause.fieldErrors).length) {
        setFieldErrors(cause.fieldErrors);
        setFormError("Review the highlighted fields and try again.");
      } else {
        setFormError(cause instanceof ApiError ? cause.message : "We couldn't save this job. Please try again.");
      }
    }
    finally { setSaving(false); }
  }

  function startEdit(job: HrJob) {
    setValues({ title: job.title, summary: job.summary ?? "", description: job.description, requiredSkills: job.required_skills ?? [], preferredSkills: job.preferred_skills ?? [], location: job.location ?? "", experience_level: job.experience_level ?? "", work_mode: job.work_mode ?? "", employment_type: job.employment_type ?? "", status: job.status, opens_at: job.opens_at ?? "", closes_at: job.closes_at ?? "" });
    setEditingId(job.id); setShowForm(true); setError(""); setFormError(""); setFieldErrors({});
  }

  async function remove(job: HrJob) {
    if (!token || !window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return;
    try {
      await deleteHrJob(token, job.id);
      if (jobs.length === 1 && page > 1) {
        setPage((current) => current - 1);
        await loadJobCounts();
      } else {
        await Promise.all([load(), loadJobCounts()]);
      }
    }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "We couldn't delete this job."); }
  }

  async function closeJob(job: HrJob) {
    if (!token || job.status === "closed" || !window.confirm(`Close “${job.title}”? Candidates will no longer be able to apply.`)) return;

    try {
      await updateHrJob(token, job.id, { status: "closed" });
      await Promise.all([load(), loadJobCounts()]);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "We couldn't close this job.");
    }
  }

  return <section>
    <div className="flex justify-end">
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b3b2c] px-4 text-sm font-semibold text-white transition hover:bg-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]" onClick={() => { setShowForm((v) => !v); setEditingId(null); setValues(emptyJob); setFormError(""); setFieldErrors({}); }} type="button">
        <span aria-hidden="true" className="text-lg leading-none">{showForm ? "×" : "+"}</span>
        {showForm ? "Close editor" : "Create job"}
      </button>
    </div>
    {showForm ? <form className="mt-5 grid gap-4 rounded-xl border border-[#d7ddd5] bg-white p-5 sm:grid-cols-2" onSubmit={submit}>
      <h3 className="sm:col-span-2 text-base font-semibold">{editingId ? "Edit job post" : "Create job post"}</h3>
      {formError ? <div className="sm:col-span-2 rounded-xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium text-[#8b281f]" role="alert">{formError}</div> : null}
      <label className="text-sm font-semibold">Job title<input aria-describedby={fieldErrors.title ? "title-error" : undefined} aria-invalid={Boolean(fieldErrors.title)} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 font-medium ${fieldErrors.title ? "border-[#c9513f]" : "border-[#d8d5c8]"}`} required value={values.title} onChange={(e) => { setValues({...values,title:e.target.value}); setFieldErrors((current) => { const next = {...current}; delete next.title; return next; }); }}/>{fieldErrors.title ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="title-error">{fieldErrors.title}</span> : null}</label>
      <label className="text-sm font-semibold">Location<input className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.location} onChange={(e) => setValues({...values,location:e.target.value})}/></label>
      <label className="text-sm font-semibold">Status<select aria-describedby={fieldErrors.status ? "status-error" : undefined} aria-invalid={Boolean(fieldErrors.status)} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 font-medium ${fieldErrors.status ? "border-[#c9513f]" : "border-[#d8d5c8]"}`} value={values.status} onChange={(e) => { const status = e.target.value as JobStatus; setValues({...values,status}); setFieldErrors((current) => { const next = {...current}; delete next.status; if (status !== "open") { delete next.opens_at; delete next.closes_at; } return next; }); if (status !== "open") setFormError(""); }}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select>{fieldErrors.status ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="status-error">{fieldErrors.status}</span> : null}</label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Applications open<input aria-describedby={fieldErrors.opens_at ? "opens-at-error" : undefined} aria-invalid={Boolean(fieldErrors.opens_at)} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 outline-none focus:ring-4 ${fieldErrors.opens_at ? "border-[#c9513f] focus:border-[#c9513f] focus:ring-[#c9513f]/15" : "border-[#d8d5c8] focus:border-[#588100] focus:ring-[#a6f20f]/20"}`} type="date" value={values.opens_at} onChange={(e) => updateDate("opens_at", e.target.value)}/>{fieldErrors.opens_at ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="opens-at-error">{fieldErrors.opens_at}</span> : null}</label>
        <label className="text-sm font-semibold">Applications close<input aria-describedby={fieldErrors.closes_at ? "closes-at-error" : undefined} aria-invalid={Boolean(fieldErrors.closes_at)} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 outline-none focus:ring-4 ${fieldErrors.closes_at ? "border-[#c9513f] focus:border-[#c9513f] focus:ring-[#c9513f]/15" : "border-[#d8d5c8] focus:border-[#588100] focus:ring-[#a6f20f]/20"}`} type="date" value={values.closes_at} onChange={(e) => updateDate("closes_at", e.target.value)}/>{fieldErrors.closes_at ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="closes-at-error">{fieldErrors.closes_at}</span> : null}</label>
      </div>
      <label className="sm:col-span-2 text-sm font-semibold">Job description<textarea aria-describedby={fieldErrors.description ? "description-error" : undefined} aria-invalid={Boolean(fieldErrors.description)} className={`mt-2 min-h-32 w-full rounded-xl border bg-white p-3 font-medium ${fieldErrors.description ? "border-[#c9513f]" : "border-[#d8d5c8]"}`} minLength={50} required value={values.description} onChange={(e) => { setValues({...values,description:e.target.value}); setFieldErrors((current) => { const next = {...current}; delete next.description; return next; }); }}/>{fieldErrors.description ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="description-error">{fieldErrors.description}</span> : null}</label>
      <label className="sm:col-span-2 text-sm font-semibold">Card summary<textarea aria-describedby={fieldErrors.summary ? "summary-error" : "summary-help"} aria-invalid={Boolean(fieldErrors.summary)} className={`mt-2 min-h-20 w-full rounded-xl border bg-white p-3 font-medium ${fieldErrors.summary ? "border-[#c9513f]" : "border-[#d8d5c8]"}`} maxLength={300} minLength={20} required value={values.summary} onChange={(e) => { setValues({...values,summary:e.target.value}); setFieldErrors((current) => { const next = {...current}; delete next.summary; return next; }); }}/>{fieldErrors.summary ? <span className="mt-1.5 block text-xs font-medium leading-5 text-[#9f2f22]" id="summary-error">{fieldErrors.summary}</span> : <span className="mt-1 block text-xs font-medium text-[#657167]" id="summary-help">A short introduction candidates see before opening the full role.</span>}</label>
      <SkillTags label="Required skills" onChange={(requiredSkills) => setValues({...values,requiredSkills})} values={values.requiredSkills}/>
      <SkillTags label="Preferred skills" onChange={(preferredSkills) => setValues({...values,preferredSkills})} values={values.preferredSkills}/>
      <label className="text-sm font-semibold">Experience level<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.experience_level} onChange={(e) => setValues({...values,experience_level:e.target.value})}><option value="">Not specified</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead</option></select></label>
      <label className="text-sm font-semibold">Work mode<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.work_mode} onChange={(e) => setValues({...values,work_mode:e.target.value})}><option value="">Not specified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on_site">On-site</option></select></label>
      <label className="text-sm font-semibold">Employment type<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.employment_type} onChange={(e) => setValues({...values,employment_type:e.target.value})}><option value="">Not specified</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></label>
      <div className="sm:col-span-2 flex justify-end gap-3"><button className="h-11 rounded-full border border-[#d8d5c8] px-5 text-sm font-semibold" onClick={() => { setShowForm(false); setEditingId(null); setValues(emptyJob); setFormError(""); setFieldErrors({}); }} type="button">Cancel</button><button className="h-11 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : editingId ? "Save changes" : "Save job"}</button></div>
    </form> : null}
    <div className="mt-5 flex flex-wrap items-center gap-1 border-b border-[#dde2db]" aria-label="Filter job posts by status">
      {jobFilters.map((filter) => (
        <button
          aria-pressed={statusFilter === filter.value}
          className={`relative inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#588100] ${statusFilter === filter.value ? "border-[#477a1f] text-[#24490f]" : "border-transparent text-[#6a756d] hover:border-[#c9d1c6] hover:text-[#20332a]"}`}
          key={filter.value}
          onClick={() => {
            setStatusFilter(filter.value);
            setPage(1);
          }}
          type="button"
        >
          {filter.label}
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${statusFilter === filter.value ? "bg-[#e9f3dd] text-[#315b18]" : "bg-[#ecefeb] text-[#6a756d]"}`}>
            {jobCounts?.[filter.value] ?? "—"}
          </span>
        </button>
      ))}
    </div>
    {error ? <div className="mt-5 rounded-xl border border-[#efc8bf] bg-[#fff8f6] p-4 text-sm text-[#8b281f]" role="alert"><p className="font-semibold">Jobs are temporarily unavailable</p><p className="mt-1 leading-6">{error}</p><button className="mt-3 font-semibold underline underline-offset-4" onClick={() => void load()} type="button">Try again</button></div> : null}
    <JobList
      editingId={editingId}
      error={error}
      jobs={jobs}
      onClose={(job) => void closeJob(job)}
      onDelete={(job) => void remove(job)}
      onEdit={startEdit}
      statusFilter={statusFilter}
    />
    {pagination && pagination.last_page > 1 ? <nav aria-label="Job post pages" className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-[#dde2db] pt-4 sm:flex-row"><button className="h-9 rounded-lg border border-[#d7ddd5] bg-white px-3.5 text-sm font-semibold text-[#405047] transition hover:border-[#b9c1b7] hover:bg-[#f7f8f5] disabled:cursor-not-allowed disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button><p className="text-sm font-medium text-[#6a756d]">Page {pagination.current_page} of {pagination.last_page} · {pagination.total} jobs</p><button className="h-9 rounded-lg border border-[#d7ddd5] bg-white px-3.5 text-sm font-semibold text-[#405047] transition hover:border-[#b9c1b7] hover:bg-[#f7f8f5] disabled:cursor-not-allowed disabled:opacity-40" disabled={page === pagination.last_page} onClick={() => setPage((current) => current + 1)} type="button">Next</button></nav> : null}
  </section>;
}
