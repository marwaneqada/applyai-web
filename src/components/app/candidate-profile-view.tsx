"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import {
  ApiError,
  getCandidateProfile,
  isUnauthorizedError,
  updateCandidateProfile,
  type CandidateProfile,
  type FieldErrors,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type LoadStatus = "loading" | "ready" | "error";

type ProfileValues = {
  name: string;
  headline: string;
  phone: string;
  location: string;
  professional_summary: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
};

type ProfileField = keyof ProfileValues;

const emptyValues: ProfileValues = {
  name: "",
  headline: "",
  phone: "",
  location: "",
  professional_summary: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

function valuesFromProfile(profile: CandidateProfile): ProfileValues {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    professional_summary: profile.professional_summary ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    github_url: profile.github_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
  };
}

function isHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(values: ProfileValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter your name.";
  } else if (values.name.trim().length > 255) {
    errors.name = "Keep your name to 255 characters or fewer.";
  }

  if (values.headline.length > 160) {
    errors.headline = "Keep your headline to 160 characters or fewer.";
  }

  if (values.phone.length > 30) {
    errors.phone = "Keep your phone number to 30 characters or fewer.";
  }

  if (values.location.length > 255) {
    errors.location = "Keep your location to 255 characters or fewer.";
  }

  if (values.professional_summary.length > 2000) {
    errors.professional_summary = "Keep your summary to 2,000 characters or fewer.";
  }

  (["linkedin_url", "github_url", "portfolio_url"] as const).forEach((field) => {
    if (!isHttpUrl(values[field].trim())) {
      errors[field] = "Enter a complete http:// or https:// URL, or leave it blank.";
    }
  });

  return errors;
}

function ProfileInput({
  description,
  error,
  label,
  name,
  onValueChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "onChange"> & {
  description?: string;
  error?: string;
  label: string;
  name: Exclude<ProfileField, "professional_summary">;
  onValueChange: (name: ProfileField, value: string) => void;
}) {
  const hintId = description ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label className="text-sm font-semibold text-[#20332a]" htmlFor={name}>
        {label}
      </label>
      {description ? (
        <p className="mt-1 text-sm leading-5 text-[#657167]" id={hintId}>
          {description}
        </p>
      ) : null}
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`mt-2 h-12 w-full rounded-2xl border bg-[#fbfaf4] px-4 text-sm font-medium text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20 ${
          error ? "border-[#b33a2b]" : "border-[#d8d5c8]"
        }`}
        id={name}
        name={name}
        onChange={(event) => onValueChange(name, event.target.value)}
      />
      {error ? (
        <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-[#e8e4d8]" />
      <div className="mt-3 h-5 w-full max-w-md animate-pulse rounded-lg bg-[#e8e4d8]" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="h-[620px] animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
        <div className="h-52 animate-pulse rounded-[28px] border border-[#e8e4d8] bg-white" />
      </div>
    </main>
  );
}

export function CandidateProfileView() {
  const { clearSession, refreshUser, token } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [values, setValues] = useState<ProfileValues>(emptyValues);
  const [savedValues, setSavedValues] = useState<ProfileValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoadStatus("loading");

    try {
      const nextProfile = await getCandidateProfile(token);
      const nextValues = valuesFromProfile(nextProfile);
      setProfile(nextProfile);
      setValues(nextValues);
      setSavedValues(nextValues);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
        return;
      }

      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your profile. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [clearSession, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function updateField(name: ProfileField, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
    setSuccessMessage("");
  }

  function resetForm() {
    setValues(savedValues);
    setFieldErrors({});
    setFormError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || isSaving) {
      return;
    }

    const nextErrors = validate(values);
    setFieldErrors(nextErrors);
    setFormError("");
    setSuccessMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const nextProfile = await updateCandidateProfile(token, {
        name: values.name.trim(),
        headline: values.headline.trim() || null,
        phone: values.phone.trim() || null,
        location: values.location.trim() || null,
        professional_summary: values.professional_summary.trim() || null,
        linkedin_url: values.linkedin_url.trim() || null,
        github_url: values.github_url.trim() || null,
        portfolio_url: values.portfolio_url.trim() || null,
      });
      const nextValues = valuesFromProfile(nextProfile);

      setProfile(nextProfile);
      setValues(nextValues);
      setSavedValues(nextValues);
      setSuccessMessage("Profile saved.");

      try {
        await refreshUser();
      } catch {
        // The profile is saved; the next session refresh will reconcile the header name.
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
        return;
      }

      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Network trouble interrupted the save. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (loadStatus === "loading") {
    return <ProfileSkeleton />;
  }

  if (loadStatus === "error") {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <h1 className="text-xl font-semibold text-[#062b1f]">Profile unavailable</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#8b281f]">
            {loadError}
          </p>
          <button
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={() => void load()}
            type="button"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-[#062b1f]">Candidate profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
          Keep the contact details and professional context you reuse across your job search.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form
          className="rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8"
          noValidate
          onSubmit={handleSubmit}
        >
          <section aria-labelledby="profile-basics-heading">
            <h2 className="text-lg font-semibold text-[#062b1f]" id="profile-basics-heading">
              Professional basics
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#657167]">
              These details identify you in the Candidate workspace.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <ProfileInput
                autoComplete="name"
                error={fieldErrors.name}
                label="Full name"
                name="name"
                onValueChange={updateField}
                value={values.name}
              />
              <ProfileInput
                autoComplete="organization-title"
                error={fieldErrors.headline}
                label="Professional headline"
                maxLength={160}
                name="headline"
                onValueChange={updateField}
                placeholder="Backend engineer"
                value={values.headline}
              />
              <ProfileInput
                autoComplete="tel"
                error={fieldErrors.phone}
                label="Phone"
                maxLength={30}
                name="phone"
                onValueChange={updateField}
                placeholder="+212 600 000 000"
                type="tel"
                value={values.phone}
              />
              <ProfileInput
                autoComplete="address-level2"
                error={fieldErrors.location}
                label="Location"
                maxLength={255}
                name="location"
                onValueChange={updateField}
                placeholder="Casablanca, Morocco"
                value={values.location}
              />
            </div>

            <div className="mt-5">
              <label
                className="text-sm font-semibold text-[#20332a]"
                htmlFor="professional_summary"
              >
                Professional summary
              </label>
              <p className="mt-1 text-sm leading-5 text-[#657167]" id="summary-hint">
                A concise overview of your focus, strengths, and the work you want to do.
              </p>
              <textarea
                aria-describedby={`summary-hint${fieldErrors.professional_summary ? " professional_summary-error" : ""}`}
                aria-invalid={Boolean(fieldErrors.professional_summary)}
                className={`mt-2 min-h-36 w-full resize-y rounded-2xl border bg-[#fbfaf4] px-4 py-3 text-sm font-medium leading-6 text-[#062b1f] outline-none transition placeholder:text-[#657167] focus:border-[#588100] focus:bg-white focus:ring-4 focus:ring-[#a6f20f]/20 ${
                  fieldErrors.professional_summary
                    ? "border-[#b33a2b]"
                    : "border-[#d8d5c8]"
                }`}
                id="professional_summary"
                maxLength={2000}
                name="professional_summary"
                onChange={(event) => updateField("professional_summary", event.target.value)}
                placeholder="I build reliable products and APIs..."
                value={values.professional_summary}
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                {fieldErrors.professional_summary ? (
                  <p
                    className="text-sm font-medium text-[#9f2f22]"
                    id="professional_summary-error"
                  >
                    {fieldErrors.professional_summary}
                  </p>
                ) : (
                  <span />
                )}
                <span className="shrink-0 text-xs font-medium text-[#657167]">
                  {values.professional_summary.length}/2,000
                </span>
              </div>
            </div>
          </section>

          <div className="my-8 h-px bg-[#e8e4d8]" />

          <section aria-labelledby="profile-links-heading">
            <h2 className="text-lg font-semibold text-[#062b1f]" id="profile-links-heading">
              Online presence
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#657167]">
              Optional links recruiters can use to understand your work.
            </p>
            <div className="mt-6 grid gap-5">
              <ProfileInput
                autoComplete="url"
                error={fieldErrors.linkedin_url}
                label="LinkedIn URL"
                name="linkedin_url"
                onValueChange={updateField}
                placeholder="https://www.linkedin.com/in/your-name"
                type="url"
                value={values.linkedin_url}
              />
              <ProfileInput
                autoComplete="url"
                error={fieldErrors.github_url}
                label="GitHub URL"
                name="github_url"
                onValueChange={updateField}
                placeholder="https://github.com/your-name"
                type="url"
                value={values.github_url}
              />
              <ProfileInput
                autoComplete="url"
                error={fieldErrors.portfolio_url}
                label="Portfolio URL"
                name="portfolio_url"
                onValueChange={updateField}
                placeholder="https://your-portfolio.com"
                type="url"
                value={values.portfolio_url}
              />
            </div>
          </section>

          <div aria-live="polite" className="mt-6 min-h-6">
            {formError ? (
              <p className="text-sm font-medium text-[#9f2f22]">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm font-semibold text-[#3f5e00]">{successMessage}</p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col-reverse gap-3 border-t border-[#e8e4d8] pt-6 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d5c8] bg-white px-5 text-sm font-semibold text-[#405047] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              disabled={!isDirty || isSaving}
              onClick={resetForm}
              type="button"
            >
              Reset changes
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_12px_28px_rgba(6,43,31,0.16)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              disabled={!isDirty || isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>

        <aside className="rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#062b1f]">Account</h2>
          <dl className="mt-5 grid gap-4">
            <div>
              <dt className="text-xs font-semibold text-[#657167]">Email</dt>
              <dd className="mt-1 break-words text-sm font-medium text-[#20332a]">
                {profile?.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[#657167]">Account type</dt>
              <dd className="mt-1 text-sm font-medium text-[#20332a]">Candidate</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-[#e8e4d8] pt-5 text-sm leading-6 text-[#657167]">
            Email changes are handled separately because they affect how you sign in.
          </p>
        </aside>
      </div>
    </main>
  );
}
