"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ApiError,
  applyToJob,
  isUnauthorizedError,
  listResumes,
  type HrJob,
  type Resume,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JobApplicationPanel({
  job,
  onApplied,
  onCancel,
}: {
  job: HrJob;
  onApplied: (job: HrJob) => void;
  onCancel: () => void;
}) {
  const { clearSession, token } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const nextResumes = await listResumes(token as string);

        if (!active) {
          return;
        }

        setResumes(nextResumes);
        setSelectedResumeId(nextResumes[0]?.id ?? null);
      } catch (cause) {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(cause)) {
          clearSession();
        } else {
          setError(
            cause instanceof ApiError
              ? cause.message
              : "We couldn't load your resumes. Please try again.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [clearSession, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || isSubmitting) {
      return;
    }

    if (!selectedResumeId) {
      setResumeError("Choose the resume you want to send.");
      return;
    }

    setError("");
    setResumeError("");
    setIsSubmitting(true);

    try {
      const updatedJob = await applyToJob(token, job.id, {
        resume_id: selectedResumeId,
        cover_letter: coverLetter.trim() || null,
      });
      onApplied(updatedJob);
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else if (cause instanceof ApiError) {
        setResumeError(cause.fieldErrors.resume_id ?? "");
        setError(cause.fieldErrors.resume_id ? "" : cause.message);
      } else {
        setError("We couldn't submit your application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mb-7 rounded-[20px] border border-[#d8d5c8] bg-[#fbfaf4] p-5 sm:p-6"
      onSubmit={submit}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#062b1f]">
            Apply for this role
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#405047]">
            Choose exactly which resume the hiring team should receive.
          </p>
        </div>
        <button
          className="self-start rounded-full px-3 py-1.5 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]"
          onClick={onCancel}
          type="button"
        >
          Close
        </button>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-[#20332a]">Resume</legend>

        {isLoading ? (
          <div className="mt-2 space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-[#eff3df]" />
            <div className="h-16 animate-pulse rounded-xl bg-[#eff3df]" />
          </div>
        ) : resumes.length ? (
          <div className="mt-2 space-y-2">
            {resumes.map((resume) => {
              const selected = selectedResumeId === resume.id;

              return (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    selected
                      ? "border-[#7ba329] bg-[#eff9d1]"
                      : "border-[#e1ded1] bg-white hover:border-[#b7b29f]"
                  }`}
                  key={resume.id}
                >
                  <input
                    checked={selected}
                    className="size-4 accent-[#588100]"
                    name="resume"
                    onChange={() => {
                      setSelectedResumeId(resume.id);
                      setResumeError("");
                    }}
                    type="radio"
                    value={resume.id}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#062b1f]">
                      {resume.original_filename}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-[#657167]">
                      {formatFileSize(resume.file_size)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-[#c9c5b6] bg-white p-4">
            <p className="text-sm font-semibold text-[#20332a]">
              Upload a resume before applying
            </p>
            <p className="mt-1 text-sm leading-6 text-[#657167]">
              Your resume library keeps each PDF reusable across applications.
            </p>
            <Link
              className="mt-3 inline-flex h-9 items-center rounded-full bg-[#062b1f] px-4 text-sm font-semibold text-[#f7f5ec]"
              href="/app/resumes"
            >
              Go to resume library
            </Link>
          </div>
        )}

        {resumeError ? (
          <p className="mt-2 text-sm font-semibold text-[#9f2f22]" role="alert">
            {resumeError}
          </p>
        ) : null}
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-[#20332a]">
          Cover letter{" "}
          <span className="font-normal text-[#657167]">(optional)</span>
        </span>
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[#d8d5c8] bg-white px-4 py-3 text-sm leading-6 text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:ring-4 focus:ring-[#a6f20f]/20"
          maxLength={10000}
          onChange={(event) => setCoverLetter(event.target.value)}
          placeholder="Share why this role interests you and what you would bring to the team."
          value={coverLetter}
        />
        <span className="mt-1 block text-right text-xs font-medium text-[#657167]">
          {coverLetter.length.toLocaleString()}/10,000
        </span>
      </label>

      {error ? (
        <p
          className="mt-4 rounded-xl border border-[#efc8bf] bg-[#fff7f4] p-3 text-sm font-semibold text-[#9f2f22]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          className="h-10 rounded-full border border-[#d8d5c8] bg-white px-4 text-sm font-semibold text-[#20332a] transition hover:bg-[#f4f2e9]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-10 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isLoading || !resumes.length || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending application..." : "Submit application"}
        </button>
      </div>
    </form>
  );
}
