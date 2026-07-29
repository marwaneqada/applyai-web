"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCandidateJob, type HrJob } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [job, setJob] = useState<HrJob | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (token) void getCandidateJob(token, Number(id)).then(setJob).catch(() => setError("This job is no longer available.")); }, [id, token]);
  return <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 lg:px-8"><Link className="text-sm font-semibold text-[#405047] hover:text-[#062b1f]" href="/app/jobs">← All jobs</Link>{error ? <p className="mt-6 rounded-2xl bg-[#fff7f4] p-5 font-semibold text-[#9f2f22]">{error}</p> : !job ? <div className="mt-6 h-80 animate-pulse rounded-[28px] bg-[#eff3df]"/> : <article className="mt-6 overflow-hidden rounded-[28px] border border-[#e1ded1] bg-white shadow-sm"><header className="bg-[#f7f9ee] p-7 sm:p-9"><p className="font-semibold text-[#588100]">{job.company_name}</p><h1 className="mt-2 text-3xl font-semibold text-[#062b1f]">{job.title}</h1><p className="mt-3 text-sm font-medium text-[#405047]">{job.location || "Location not specified"} · Applications close {job.closes_at}</p></header><div className="p-7 sm:p-9"><h2 className="text-lg font-semibold">About this role</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#405047]">{job.description}</p></div></article>}</main>;
}
