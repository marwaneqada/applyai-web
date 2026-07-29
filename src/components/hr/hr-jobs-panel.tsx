"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, createHrJob, deleteHrJob, isUnauthorizedError, listHrJobs, updateHrJob, type HrJob, type JobStatus } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const emptyJob = { title: "", summary: "", description: "", requiredSkills: [] as string[], preferredSkills: [] as string[], location: "", experience_level: "", work_mode: "", employment_type: "", status: "draft" as JobStatus, opens_at: "", closes_at: "" };
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
  const [values, setValues] = useState(emptyJob);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try { setJobs(await listHrJobs(token)); setError(""); }
    catch (cause) { if (isUnauthorizedError(cause)) clearSession(); else setError(cause instanceof ApiError ? cause.message : "We couldn't load jobs."); }
  }, [clearSession, token]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving) return;
    setSaving(true); setError("");
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
      setJobs((current) => editingId ? current.map((item) => item.id === job.id ? job : item) : [job, ...current]);
      setValues(emptyJob); setEditingId(null); setShowForm(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "We couldn't save this job."); }
    finally { setSaving(false); }
  }

  function startEdit(job: HrJob) {
    setValues({ title: job.title, summary: job.summary ?? "", description: job.description, requiredSkills: job.required_skills ?? [], preferredSkills: job.preferred_skills ?? [], location: job.location ?? "", experience_level: job.experience_level ?? "", work_mode: job.work_mode ?? "", employment_type: job.employment_type ?? "", status: job.status, opens_at: job.opens_at ?? "", closes_at: job.closes_at ?? "" });
    setEditingId(job.id); setShowForm(true); setError("");
  }

  async function remove(job: HrJob) {
    if (!token || !window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return;
    try { await deleteHrJob(token, job.id); setJobs((current) => current.filter((item) => item.id !== job.id)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "We couldn't delete this job."); }
  }

  return <section className="mt-8 border-t border-[#e8e4d8] pt-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-xl font-semibold">Job posts</h2><p className="mt-2 text-sm leading-6 text-[#657167]">Create roles and control exactly when candidates can apply.</p></div>
      <button className="h-11 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] hover:bg-[#031a13]" onClick={() => { setShowForm((v) => !v); setEditingId(null); setValues(emptyJob); }} type="button">{showForm ? "Close editor" : "Create job"}</button>
    </div>
    {showForm ? <form className="mt-6 grid gap-4 rounded-[24px] border border-[#e1ded1] bg-[#fbfaf4] p-5 sm:grid-cols-2" onSubmit={submit}>
      <h3 className="sm:col-span-2 text-base font-semibold">{editingId ? "Edit job post" : "Create job post"}</h3>
      <label className="text-sm font-semibold">Job title<input className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" required value={values.title} onChange={(e) => setValues({...values,title:e.target.value})}/></label>
      <label className="text-sm font-semibold">Location<input className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.location} onChange={(e) => setValues({...values,location:e.target.value})}/></label>
      <label className="text-sm font-semibold">Status<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.status} onChange={(e) => setValues({...values,status:e.target.value as JobStatus})}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Opens<input className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3" type="date" value={values.opens_at} onChange={(e) => setValues({...values,opens_at:e.target.value})}/></label><label className="text-sm font-semibold">Closes<input className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3" type="date" value={values.closes_at} onChange={(e) => setValues({...values,closes_at:e.target.value})}/></label></div>
      <label className="sm:col-span-2 text-sm font-semibold">Job description<textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#d8d5c8] bg-white p-3 font-medium" minLength={50} required value={values.description} onChange={(e) => setValues({...values,description:e.target.value})}/></label>
      <label className="sm:col-span-2 text-sm font-semibold">Card summary<textarea className="mt-2 min-h-20 w-full rounded-xl border border-[#d8d5c8] bg-white p-3 font-medium" maxLength={300} minLength={20} required value={values.summary} onChange={(e) => setValues({...values,summary:e.target.value})}/><span className="mt-1 block text-xs font-medium text-[#657167]">A short introduction candidates see before opening the full role.</span></label>
      <SkillTags label="Required skills" onChange={(requiredSkills) => setValues({...values,requiredSkills})} values={values.requiredSkills}/>
      <SkillTags label="Preferred skills" onChange={(preferredSkills) => setValues({...values,preferredSkills})} values={values.preferredSkills}/>
      <label className="text-sm font-semibold">Experience level<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.experience_level} onChange={(e) => setValues({...values,experience_level:e.target.value})}><option value="">Not specified</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead</option></select></label>
      <label className="text-sm font-semibold">Work mode<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.work_mode} onChange={(e) => setValues({...values,work_mode:e.target.value})}><option value="">Not specified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on_site">On-site</option></select></label>
      <label className="text-sm font-semibold">Employment type<select className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 font-medium" value={values.employment_type} onChange={(e) => setValues({...values,employment_type:e.target.value})}><option value="">Not specified</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></label>
      <div className="sm:col-span-2 flex justify-end gap-3"><button className="h-11 rounded-full border border-[#d8d5c8] px-5 text-sm font-semibold" onClick={() => { setShowForm(false); setEditingId(null); setValues(emptyJob); }} type="button">Cancel</button><button className="h-11 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : editingId ? "Save changes" : "Save job"}</button></div>
    </form> : null}
    {error ? <div className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm text-[#8b281f]" role="alert"><p className="font-semibold">Jobs are temporarily unavailable</p><p className="mt-1 leading-6">{error}</p><button className="mt-3 font-semibold underline underline-offset-4" onClick={() => void load()} type="button">Try again</button></div> : null}
    <div className="mt-6 grid gap-3">{jobs.filter((job) => job.id !== editingId).map((job) => <article className="rounded-2xl border border-[#e1ded1] bg-white p-5" key={job.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-sm text-[#657167]">{job.location || "Location not set"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[job.status]}`}>{job.accepting_applications ? "Accepting applications" : job.status}</span></div><p className="mt-3 text-sm leading-6 text-[#405047]">{job.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-[#657167]">Window: {job.opens_at || "not set"} — {job.closes_at || "not set"}</p><div className="flex gap-2"><button className="rounded-full border border-[#d8d5c8] px-4 py-2 text-sm font-semibold hover:bg-[#fbfaf4]" onClick={() => startEdit(job)} type="button">Edit</button><button className="rounded-full px-4 py-2 text-sm font-semibold text-[#9f2f22] hover:bg-[#fff7f4]" onClick={() => void remove(job)} type="button">Delete</button></div></div></article>)}{!jobs.length && !error ? <p className="rounded-2xl bg-[#eff3df] p-5 text-sm leading-6 text-[#405047]">No jobs yet. Create your first role when you are ready to publish it.</p> : null}</div>
  </section>;
}
