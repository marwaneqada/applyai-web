"use client";

import { motion } from "framer-motion";
import type { Application } from "@/lib/api";
import { formatDate, matchScoreClass, motionEase, originMeta, statusMeta } from "./applications-shared";

export function ApplicationDetailsModal({
  application,
  candidateMessage,
  onClose,
  onEdit,
}: {
  application: Application;
  candidateMessage?: string | null;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const meta = statusMeta[application.status];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#062b1f]/40 px-4 py-8 backdrop-blur-sm" onClick={onClose} role="presentation">
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="application-details-title"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-[0_30px_80px_rgba(6,43,31,0.22)] sm:p-8"
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        transition={{ duration: 0.28, ease: motionEase }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#588100]">Application details</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#062b1f]" id="application-details-title">{application.job_title}</h2>
            <p className="mt-1 text-sm font-medium text-[#657167]">{application.company_name}</p>
          </div>
          <button aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#657167] transition hover:bg-[#eff3df] hover:text-[#062b1f]" onClick={onClose} type="button">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.chipClassName}`}><span className={`size-2 rounded-full ${meta.dotClassName}`} />{meta.label}</span>
          <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${originMeta[application.origin].chipClassName}`}>{originMeta[application.origin].label}</span>
          {application.applied_date ? <span className="rounded-full bg-[#f4f2ea] px-3 py-1.5 text-xs font-semibold text-[#657167]">Applied {formatDate(application.applied_date)}</span> : null}
        </div>

        {application.origin === "applyai" && application.match ? (
          <section className="mt-6 rounded-2xl border border-[#e1edbd] bg-[#f7ffdf] p-4" aria-label="Application match score">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#062b1f]">Resume match</h3>
                <p className="mt-1 text-xs text-[#657167]">Candidate-safe scoring from the hiring team&apos;s analysis.</p>
              </div>
              {application.match.status === "completed" && typeof application.match.overall_score === "number" ? (
                <span className={`inline-flex items-baseline gap-0.5 rounded-full border px-3 py-1 text-xs font-semibold ${matchScoreClass(application.match.overall_score)}`}>
                  <span className="text-base">{Math.round(application.match.overall_score)}</span><span className="opacity-70">/100</span>
                </span>
              ) : (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#657167]">
                  {application.match.status === "failed" ? "Unavailable" : "Analyzing"}
                </span>
              )}
            </div>
            {application.match.status === "completed" ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#405047]">
                <span>Skills <strong className="text-[#062b1f]">{application.match.skills_score ?? "—"}/100</strong></span>
                <span>Experience <strong className="text-[#062b1f]">{application.match.experience_score ?? "—"}/100</strong></span>
              </div>
            ) : null}
          </section>
        ) : null}

        {application.origin === "external" ? (
          <>
            <dl className="mt-6 grid gap-5 border-y border-[#eee9db] py-5 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-[#87917f]">Contact</dt><dd className="mt-1 text-sm font-semibold text-[#20332a]">{application.contact_name ?? "No contact added"}</dd></div>
              <div><dt className="text-xs font-semibold text-[#87917f]">Contact email</dt><dd className="mt-1 break-all text-sm font-semibold text-[#20332a]">{application.contact_email ?? "No email added"}</dd></div>
            </dl>
            {application.notes ? <div className="mt-5"><h3 className="text-xs font-semibold text-[#87917f]">Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#405047]">{application.notes}</p></div> : null}
          </>
        ) : (
          candidateMessage ? (
            <section className="mt-6 rounded-2xl border border-[#d9e9c5] bg-[#f2ffd4] px-4 py-4" aria-label="Message from the hiring team">
              <h3 className="text-sm font-semibold text-[#315000]">Message from the hiring team</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#405047]">{candidateMessage}</p>
            </section>
          ) : null
        )}
        {application.job_url ? <a className="mt-5 block truncate text-sm font-semibold text-[#588100] underline underline-offset-4" href={application.job_url} rel="noreferrer" target="_blank">Open job listing</a> : null}

        <div className="mt-7 flex justify-end gap-3">
          <button className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df]" onClick={onClose} type="button">Close</button>
          {application.origin === "external" && onEdit ? (
            <button className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13]" onClick={onEdit} type="button">Edit application</button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
