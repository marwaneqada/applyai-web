"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ApiError,
  createApplication,
  updateApplication,
  type Application,
  type CreateApplicationPayload,
  type FieldErrors,
} from "@/lib/api";
import { motionEase } from "./applications-shared";

const inputBase =
  "mt-2 w-full rounded-2xl border bg-[#fbfaf4] px-4 text-sm font-medium text-[#062b1f] outline-none transition placeholder:text-[#87917f] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20";

function border(error?: string) {
  return error ? "border-[#b33a2b]" : "border-[#d8d5c8]";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function Field({
  children,
  htmlFor,
  label,
  optional,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#20332a]" htmlFor={htmlFor}>
        {label}{" "}
        {optional ? (
          <span className="font-normal text-[#87917f]">(optional)</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={id}>
      {message}
    </p>
  );
}

export function ApplicationFormModal({
  analysisId,
  initial,
  mode,
  onClose,
  onSaved,
  prefill,
  token,
}: {
  analysisId?: number | null;
  initial?: Application;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (application: Application) => void;
  prefill?: {
    company_name?: string | null;
    job_title?: string | null;
    job_url?: string | null;
  };
  token: string;
}) {
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(
    initial?.company_name ?? prefill?.company_name ?? "",
  );
  const [jobTitle, setJobTitle] = useState(
    initial?.job_title ?? prefill?.job_title ?? "",
  );
  const [jobUrl, setJobUrl] = useState(initial?.job_url ?? prefill?.job_url ?? "");
  const [appliedDate, setAppliedDate] = useState(initial?.applied_date ?? "");
  const [contactName, setContactName] = useState(initial?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    firstFieldRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function clearError(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!companyName.trim()) {
      errors.company_name = "Enter the company name.";
    }

    if (!jobTitle.trim()) {
      errors.job_title = "Enter the job title.";
    }

    if (jobUrl.trim() && !isValidUrl(jobUrl.trim())) {
      errors.job_url = "Enter a valid URL, or leave it blank.";
    }

    if (contactEmail.trim() && !isValidEmail(contactEmail.trim())) {
      errors.contact_email = "Enter a valid email, or leave it blank.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CreateApplicationPayload = {
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      job_url: jobUrl.trim() ? jobUrl.trim() : null,
      applied_date: appliedDate.trim() ? appliedDate.trim() : null,
      contact_name: contactName.trim() ? contactName.trim() : null,
      contact_email: contactEmail.trim() ? contactEmail.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    };

    if (mode !== "edit" && analysisId) {
      payload.analysis_id = analysisId;
    }

    setIsSubmitting(true);

    try {
      const application =
        mode === "edit" && initial
          ? await updateApplication(token, initial.id, payload)
          : await createApplication(token, payload);

      onSaved(application);
      onClose();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#062b1f]/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="application-modal-title"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-[0_30px_80px_rgba(6,43,31,0.22)] sm:p-8"
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        transition={{ duration: 0.28, ease: motionEase }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            className="text-xl font-semibold text-[#062b1f]"
            id="application-modal-title"
          >
            {mode === "edit" ? "Edit application" : "Add application"}
          </h2>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#657167] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {formError ? (
          <div className="mt-5 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#8b281f]">
            {formError}
          </div>
        ) : null}

        <form className="mt-5 grid gap-4" noValidate onSubmit={handleSubmit}>
          <Field htmlFor="company_name" label="Company">
            <input
              aria-invalid={Boolean(fieldErrors.company_name)}
              className={`${inputBase} ${border(fieldErrors.company_name)} h-12`}
              id="company_name"
              onChange={(event) => {
                setCompanyName(event.target.value);
                clearError("company_name");
              }}
              placeholder="Acme Inc."
              ref={firstFieldRef}
              type="text"
              value={companyName}
            />
            <ErrorText id="company_name-error" message={fieldErrors.company_name} />
          </Field>

          <Field htmlFor="job_title" label="Job title">
            <input
              aria-invalid={Boolean(fieldErrors.job_title)}
              className={`${inputBase} ${border(fieldErrors.job_title)} h-12`}
              id="job_title"
              onChange={(event) => {
                setJobTitle(event.target.value);
                clearError("job_title");
              }}
              placeholder="Senior Frontend Engineer"
              type="text"
              value={jobTitle}
            />
            <ErrorText id="job_title-error" message={fieldErrors.job_title} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="job_url" label="Job URL" optional>
              <input
                aria-invalid={Boolean(fieldErrors.job_url)}
                className={`${inputBase} ${border(fieldErrors.job_url)} h-12`}
                id="job_url"
                onChange={(event) => {
                  setJobUrl(event.target.value);
                  clearError("job_url");
                }}
                placeholder="https://..."
                type="url"
                value={jobUrl}
              />
              <ErrorText id="job_url-error" message={fieldErrors.job_url} />
            </Field>

            <Field htmlFor="applied_date" label="Applied date" optional>
              <input
                className={`${inputBase} ${border()} h-12`}
                id="applied_date"
                onChange={(event) => setAppliedDate(event.target.value)}
                type="date"
                value={appliedDate}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="contact_name" label="Contact name" optional>
              <input
                className={`${inputBase} ${border()} h-12`}
                id="contact_name"
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Jane Doe"
                type="text"
                value={contactName}
              />
            </Field>

            <Field htmlFor="contact_email" label="Contact email" optional>
              <input
                aria-invalid={Boolean(fieldErrors.contact_email)}
                className={`${inputBase} ${border(fieldErrors.contact_email)} h-12`}
                id="contact_email"
                onChange={(event) => {
                  setContactEmail(event.target.value);
                  clearError("contact_email");
                }}
                placeholder="jane@acme.com"
                type="email"
                value={contactEmail}
              />
              <ErrorText id="contact_email-error" message={fieldErrors.contact_email} />
            </Field>
          </div>

          <Field htmlFor="notes" label="Notes" optional>
            <textarea
              className={`${inputBase} ${border()} min-h-24 py-3 leading-6`}
              id="notes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth remembering..."
              rows={3}
              value={notes}
            />
          </Field>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-[#a6f20f]" />
              ) : null}
              {isSubmitting
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Add application"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
