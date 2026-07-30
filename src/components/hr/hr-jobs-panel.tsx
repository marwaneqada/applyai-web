"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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

function SkillTags({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add() { const skill = draft.trim(); if (skill && !values.some((value) => value.toLowerCase() === skill.toLowerCase()) && values.length < 20) onChange([...values, skill]); setDraft(""); }
  return <div><span className="text-sm font-semibold">{label}</span><div className="mt-2 rounded-xl border border-[#d8d5c8] bg-white p-2 focus-within:border-[#588100] focus-within:ring-4 focus-within:ring-[#a6f20f]/20">{values.length ? <div className="flex flex-wrap gap-2">{values.map((skill) => <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f6c8] py-1 pl-3 pr-1 text-sm font-semibold text-[#20332a]" key={skill}>{skill}<button aria-label={`Remove ${skill}`} className="grid size-6 place-items-center rounded-full hover:bg-[#d5eca1]" onClick={() => onChange(values.filter((value) => value !== skill))} type="button">×</button></span>)}</div> : null}<div className={`flex gap-2 ${values.length ? "mt-2" : ""}`}><input className="h-9 min-w-0 flex-1 px-2 text-sm outline-none" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Type a skill" value={draft}/><button className="rounded-full bg-[#eff3df] px-3 text-sm font-semibold" disabled={!draft.trim()} onClick={add} type="button">Add</button></div></div><span className="mt-1 block text-xs font-medium text-[#657167]">Type one skill at a time, then press Enter or Add.</span></div>;
}

export function HrJobsPanel() {
  const { clearSession, token } = useAuth();
  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [values, setValues] = useState(emptyJob);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await listHrJobs(token, page);
      setJobs(response.data);
      setPagination(response.meta);
      setError("");
    }
    catch (cause) { if (isUnauthorizedError(cause)) clearSession(); else setError(cause instanceof ApiError ? cause.message : "We couldn't load jobs."); }
  }, [clearSession, page, token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

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
      const job = editingId ? await updateHrJob(token, editingId, payload) : await createHrJob(token, payload);
      if (editingId) {
        setJobs((current) => current.map((item) => item.id === job.id ? job : item));
      } else if (page === 1) {
        await load();
      } else {
        setPage(1);
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
      } else {
        await load();
      }
    }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "We couldn't delete this job."); }
  }

  return <section>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-xl font-semibold">Job posts</h2><p className="mt-2 text-sm leading-6 text-[#657167]">Create roles and control exactly when candidates can apply.</p></div>
      <button className="h-11 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] hover:bg-[#031a13]" onClick={() => { setShowForm((v) => !v); setEditingId(null); setValues(emptyJob); setFormError(""); setFieldErrors({}); }} type="button">{showForm ? "Close editor" : "Create job"}</button>
    </div>
    {showForm ? <form className="mt-6 grid gap-4 rounded-[24px] border border-[#e1ded1] bg-[#fbfaf4] p-5 sm:grid-cols-2" onSubmit={submit}>
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
    {error ? <div className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm text-[#8b281f]" role="alert"><p className="font-semibold">Jobs are temporarily unavailable</p><p className="mt-1 leading-6">{error}</p><button className="mt-3 font-semibold underline underline-offset-4" onClick={() => void load()} type="button">Try again</button></div> : null}
    <div className="mt-6 grid gap-3">{jobs.filter((job) => job.id !== editingId).map((job) => <article className="rounded-2xl border border-[#e1ded1] bg-white p-5" key={job.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-sm text-[#657167]">{job.location || "Location not set"}</p></div><div className="flex flex-wrap items-center justify-end gap-2"><span className="rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-3 py-1 text-xs font-semibold text-[#405047]">{job.submissions_count ?? 0} {(job.submissions_count ?? 0) === 1 ? "applicant" : "applicants"}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[job.status]}`}>{job.accepting_applications ? "Accepting applications" : job.status}</span></div></div><p className="mt-3 text-sm leading-6 text-[#405047]">{job.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-[#657167]">Window: {job.opens_at || "not set"} — {job.closes_at || "not set"}</p><div className="flex flex-wrap gap-2"><Link className="rounded-full border border-[#a9c878] bg-[#eff9d1] px-4 py-2 text-sm font-semibold text-[#315000] hover:bg-[#e1edc5]" href={`/hr/jobs/${job.id}`}>Applicants</Link><button className="rounded-full border border-[#d8d5c8] px-4 py-2 text-sm font-semibold hover:bg-[#fbfaf4]" onClick={() => startEdit(job)} type="button">Edit</button><button className="rounded-full px-4 py-2 text-sm font-semibold text-[#9f2f22] hover:bg-[#fff7f4]" onClick={() => void remove(job)} type="button">Delete</button></div></div></article>)}{!jobs.length && !error ? <p className="rounded-2xl bg-[#eff3df] p-5 text-sm leading-6 text-[#405047]">No jobs yet. Create your first role when you are ready to publish it.</p> : null}</div>
    {pagination && pagination.last_page > 1 ? <nav aria-label="Job post pages" className="mt-5 flex items-center justify-between gap-3 border-t border-[#e8e4d8] pt-5"><button className="h-10 rounded-full border border-[#d8d5c8] bg-white px-4 text-sm font-semibold text-[#405047] transition hover:border-[#a9c878] hover:bg-[#eff9d1] disabled:cursor-not-allowed disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button><p className="text-sm font-semibold text-[#657167]">Page {pagination.current_page} of {pagination.last_page} · {pagination.total} jobs</p><button className="h-10 rounded-full border border-[#d8d5c8] bg-white px-4 text-sm font-semibold text-[#405047] transition hover:border-[#a9c878] hover:bg-[#eff9d1] disabled:cursor-not-allowed disabled:opacity-40" disabled={page === pagination.last_page} onClick={() => setPage((current) => current + 1)} type="button">Next</button></nav> : null}
  </section>;
}
