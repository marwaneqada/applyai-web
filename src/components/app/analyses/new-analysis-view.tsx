"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ApiError,
  createAnalysis,
  listResumes,
  type FieldErrors,
  type Resume,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { motionEase } from "./analysis-shared";

type LoadStatus = "loading" | "ready" | "error";

const MIN_DESCRIPTION_LENGTH = 100;

const inputBase =
  "mt-2 w-full rounded-2xl border bg-[#fbfaf4] px-4 text-sm font-medium text-[#062b1f] outline-none transition placeholder:text-[#87917f] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20";

function fieldBorder(error?: string) {
  return error ? "border-[#b33a2b]" : "border-[#d8d5c8]";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={id}>
      {message}
    </p>
  );
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function NewAnalysisView() {
  const { token } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");

  const [resumeId, setResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await listResumes(token);
      const parsed = data.filter((resume) => resume.parse_status === "success");
      setResumes(parsed);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your resumes. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function clearFieldError(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!resumeId) {
      errors.resume_id = "Select a resume.";
    }

    if (!jobTitle.trim()) {
      errors.job_title = "Enter the job title.";
    }

    if (jobDescription.trim().length < MIN_DESCRIPTION_LENGTH) {
      errors.job_description = `Paste the job description (at least ${MIN_DESCRIPTION_LENGTH} characters).`;
    }

    if (jobUrl.trim() && !isValidUrl(jobUrl.trim())) {
      errors.job_url = "Enter a valid URL, or leave it blank.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || isSubmitting) {
      return;
    }

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const analysis = await createAnalysis(token, {
        resume_id: Number(resumeId),
        job_title: jobTitle.trim(),
        company_name: companyName.trim() ? companyName.trim() : null,
        job_url: jobUrl.trim() ? jobUrl.trim() : null,
        job_description: jobDescription.trim(),
      });

      router.push(`/app/analyses/${analysis.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Network trouble interrupted the request. Please try again.");
      }

      setIsSubmitting(false);
    }
  }

  const descriptionCount = jobDescription.trim().length;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 lg:px-8">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#405047] transition hover:text-[#062b1f]"
        href="/app/analyses"
      >
        <span aria-hidden="true">&larr;</span> All analyses
      </Link>

      <motion.div
        className="mt-6"
        {...(reduceMotion
          ? {}
          : {
              animate: { opacity: 1, y: 0 },
              initial: { opacity: 0, y: 12 },
              transition: { duration: 0.5, ease: motionEase },
            })}
      >
        <h1 className="text-3xl font-semibold text-[#062b1f]">New analysis</h1>
        <p className="mt-3 text-sm leading-6 text-[#657167]">
          Choose a parsed resume and paste the job description you want to target.
        </p>
      </motion.div>

      {loadStatus === "loading" ? (
        <div className="mt-8 h-72 animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
      ) : null}

      {loadStatus === "error" ? (
        <div className="mt-8 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{loadError}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={() => void load()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === "ready" && resumes.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#d8d5c8] bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-[#062b1f]">
            No parsed resumes yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#657167]">
            You need a successfully parsed resume before running an analysis.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            href="/app/resumes"
          >
            Upload a resume
          </Link>
        </div>
      ) : null}

      {loadStatus === "ready" && resumes.length > 0 ? (
        <motion.section
          className="mt-8 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8"
          data-tour="analysis-form"
          {...(reduceMotion
            ? {}
            : {
                animate: { opacity: 1, y: 0 },
                initial: { opacity: 0, y: 12 },
                transition: { duration: 0.5, delay: 0.06, ease: motionEase },
              })}
        >
          {formError ? (
            <div className="mb-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#8b281f]">
              {formError}
            </div>
          ) : null}

          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label
                className="text-sm font-semibold text-[#20332a]"
                htmlFor="resume_id"
              >
                Resume
              </label>
              <div className="relative">
                <select
                  aria-describedby={
                    fieldErrors.resume_id ? "resume_id-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.resume_id)}
                  className={`${inputBase} ${fieldBorder(fieldErrors.resume_id)} h-12 appearance-none pr-10`}
                  id="resume_id"
                  onChange={(event) => {
                    setResumeId(event.target.value);
                    clearFieldError("resume_id");
                  }}
                  value={resumeId}
                >
                  <option value="">Select a resume</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={String(resume.id)}>
                      {resume.original_filename}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[#657167]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <FieldError id="resume_id-error" message={fieldErrors.resume_id} />
            </div>

            <div>
              <label
                className="text-sm font-semibold text-[#20332a]"
                htmlFor="job_title"
              >
                Job title
              </label>
              <input
                aria-describedby={
                  fieldErrors.job_title ? "job_title-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.job_title)}
                className={`${inputBase} ${fieldBorder(fieldErrors.job_title)} h-12`}
                id="job_title"
                onChange={(event) => {
                  setJobTitle(event.target.value);
                  clearFieldError("job_title");
                }}
                placeholder="Senior Frontend Engineer"
                type="text"
                value={jobTitle}
              />
              <FieldError id="job_title-error" message={fieldErrors.job_title} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  className="text-sm font-semibold text-[#20332a]"
                  htmlFor="company_name"
                >
                  Company <span className="font-normal text-[#87917f]">(optional)</span>
                </label>
                <input
                  className={`${inputBase} ${fieldBorder()} h-12`}
                  id="company_name"
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Acme Inc."
                  type="text"
                  value={companyName}
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-[#20332a]"
                  htmlFor="job_url"
                >
                  Job URL <span className="font-normal text-[#87917f]">(optional)</span>
                </label>
                <input
                  aria-describedby={
                    fieldErrors.job_url ? "job_url-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.job_url)}
                  className={`${inputBase} ${fieldBorder(fieldErrors.job_url)} h-12`}
                  id="job_url"
                  onChange={(event) => {
                    setJobUrl(event.target.value);
                    clearFieldError("job_url");
                  }}
                  placeholder="https://..."
                  type="url"
                  value={jobUrl}
                />
                <FieldError id="job_url-error" message={fieldErrors.job_url} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-[#20332a]"
                  htmlFor="job_description"
                >
                  Job description
                </label>
                <span
                  className={`text-xs font-medium ${
                    descriptionCount >= MIN_DESCRIPTION_LENGTH
                      ? "text-[#315000]"
                      : "text-[#87917f]"
                  }`}
                >
                  {descriptionCount} / {MIN_DESCRIPTION_LENGTH} min
                </span>
              </div>
              <textarea
                aria-describedby={
                  fieldErrors.job_description ? "job_description-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.job_description)}
                className={`${inputBase} ${fieldBorder(fieldErrors.job_description)} min-h-44 py-3 leading-6`}
                id="job_description"
                onChange={(event) => {
                  setJobDescription(event.target.value);
                  clearFieldError("job_description");
                }}
                placeholder="Paste the full job description here..."
                rows={8}
                value={jobDescription}
              />
              <FieldError
                id="job_description-error"
                message={fieldErrors.job_description}
              />
            </div>

            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              data-tour="run-analysis"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-[#a6f20f]" />
              ) : null}
              {isSubmitting ? "Starting analysis..." : "Run analysis"}
            </button>
          </form>
        </motion.section>
      ) : null}
    </main>
  );
}
