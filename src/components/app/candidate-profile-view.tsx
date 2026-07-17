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
  type CandidateAvailability,
  type CandidateProfile,
  type EmploymentType,
  type FieldErrors,
  type WorkMode,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type LoadStatus = "loading" | "ready" | "error";

type ProfileValues = {
  name: string;
  headline: string;
  phone: string;
  location: string;
  professional_summary: string;
  desired_roles: string[];
  preferred_locations: string[];
  work_modes: WorkMode[];
  employment_types: EmploymentType[];
  availability: CandidateAvailability | "";
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
  desired_roles: [],
  preferred_locations: [],
  work_modes: [],
  employment_types: [],
  availability: "",
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
    desired_roles: profile.desired_roles ?? [],
    preferred_locations: profile.preferred_locations ?? [],
    work_modes: profile.work_modes ?? [],
    employment_types: profile.employment_types ?? [],
    availability: profile.availability ?? "",
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

  if (values.desired_roles.some((role) => !role.trim() || role.length > 100)) {
    errors.desired_roles = "Each target role must be 100 characters or fewer.";
  }

  if (values.preferred_locations.some((location) => !location.trim() || location.length > 100)) {
    errors.preferred_locations = "Each preferred location must be 100 characters or fewer.";
  }

  (["linkedin_url", "github_url", "portfolio_url"] as const).forEach((field) => {
    if (!isHttpUrl(values[field].trim())) {
      errors[field] = "Enter a complete http:// or https:// URL, or leave it blank.";
    }
  });

  return errors;
}

const workModeOptions: { label: string; value: WorkMode }[] = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "on_site" },
];

const employmentTypeOptions: { label: string; value: EmploymentType }[] = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const availabilityOptions: { label: string; value: CandidateAvailability }[] = [
  { label: "Actively looking", value: "actively_looking" },
  { label: "Open to opportunities", value: "open_to_opportunities" },
  { label: "Not looking right now", value: "not_looking" },
];

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

function TagListInput({
  description,
  error,
  label,
  name,
  onChange,
  placeholder,
  values,
}: {
  description: string;
  error?: string;
  label: string;
  name: "desired_roles" | "preferred_locations";
  onChange: (values: string[]) => void;
  placeholder: string;
  values: string[];
}) {
  const [draft, setDraft] = useState("");
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  function addDraft() {
    const nextValue = draft.trim();

    if (!nextValue || values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      setDraft("");
      return;
    }

    if (values.length < 10) {
      onChange([...values, nextValue]);
    }

    setDraft("");
  }

  return (
    <div>
      <label className="text-sm font-semibold text-[#20332a]" htmlFor={name}>
        {label}
      </label>
      <p className="mt-1 text-sm leading-5 text-[#657167]" id={hintId}>
        {description}
      </p>
      <div
        className={`mt-2 rounded-2xl border bg-[#fbfaf4] p-2 transition focus-within:border-[#588100] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#a6f20f]/20 ${
          error ? "border-[#b33a2b]" : "border-[#d8d5c8]"
        }`}
      >
        {values.length ? (
          <ul className="flex flex-wrap gap-2" aria-label={`${label} selected`}>
            {values.map((value) => (
              <li className="inline-flex items-center gap-1 rounded-full bg-[#e9f6c8] py-1 pl-3 pr-1 text-sm font-medium text-[#20332a]" key={value}>
                {value}
                <button
                  aria-label={`Remove ${value}`}
                  className="grid size-7 place-items-center rounded-full text-[#405047] transition hover:bg-[#d5eca1] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#588100]"
                  onClick={() => onChange(values.filter((item) => item !== value))}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className={values.length ? "mt-2 flex gap-2" : "flex gap-2"}>
          <input
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
            aria-invalid={Boolean(error)}
            className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-[#062b1f] outline-none placeholder:text-[#657167]"
            disabled={values.length >= 10}
            id={name}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addDraft();
              }
            }}
            placeholder={values.length >= 10 ? "Maximum of 10" : placeholder}
            value={draft}
          />
          <button
            className="h-9 rounded-full bg-[#eff3df] px-3 text-sm font-semibold text-[#20332a] transition hover:bg-[#dfecc0] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]"
            disabled={!draft.trim() || values.length >= 10}
            onClick={addDraft}
            type="button"
          >
            Add
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-[#9f2f22]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChoicePills<T extends string>({
  description,
  label,
  name,
  onChange,
  options,
  values,
}: {
  description: string;
  label: string;
  name: string;
  onChange: (values: T[]) => void;
  options: { label: string; value: T }[];
  values: T[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#20332a]">{label}</legend>
      <p className="mt-1 text-sm leading-5 text-[#657167]">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);

          return (
            <button
              aria-pressed={selected}
              className={`h-10 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${
                selected
                  ? "border-[#062b1f] bg-[#062b1f] text-[#f7f5ec]"
                  : "border-[#d8d5c8] bg-white text-[#405047] hover:border-[#b7b29f] hover:bg-[#fbfaf4]"
              }`}
              key={option.value}
              name={name}
              onClick={() =>
                onChange(
                  selected
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value],
                )
              }
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
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

function displayAvailability(value: CandidateAvailability | "") {
  return availabilityOptions.find((option) => option.value === value)?.label ?? "Not set";
}

function displayWorkMode(value: WorkMode) {
  return workModeOptions.find((option) => option.value === value)?.label ?? value;
}

function displayEmploymentType(value: EmploymentType) {
  return employmentTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function ProfileOverview({
  email,
  onEdit,
  values,
}: {
  email: string;
  onEdit: () => void;
  values: ProfileValues;
}) {
  const profileInitial = values.name.trim().charAt(0).toUpperCase() || "C";
  const profileLinks = [
    { href: values.linkedin_url, label: "LinkedIn" },
    { href: values.github_url, label: "GitHub" },
    { href: values.portfolio_url, label: "Portfolio" },
  ].filter((link) => link.href);

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e1ded1] bg-white shadow-sm">
      <div className="border-b border-[#e8e4d8] bg-[#eff3df] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#062b1f] text-xl font-semibold text-[#f7f5ec]"
            >
              {profileInitial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[#062b1f]">{values.name}</h2>
              <p className="mt-1 text-sm font-medium text-[#405047]">
                {values.headline || "Add a professional headline"}
              </p>
              {values.location ? (
                <p className="mt-1 text-sm text-[#657167]">{values.location}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#3f5e00] shadow-sm">
              {displayAvailability(values.availability)}
            </span>
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_12px_28px_rgba(6,43,31,0.16)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={onEdit}
              type="button"
            >
              Edit profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-[#e8e4d8] sm:divide-y-0 lg:grid-cols-2 lg:divide-x">
        <section className="p-6 sm:p-8" aria-labelledby="profile-summary-heading">
          <h3 className="text-base font-semibold text-[#062b1f]" id="profile-summary-heading">
            About
          </h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#405047]">
            {values.professional_summary || "Add a short summary to introduce your professional focus."}
          </p>

          <div className="mt-7 border-t border-[#e8e4d8] pt-6">
            <h3 className="text-base font-semibold text-[#062b1f]">Contact</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Email</dt>
                <dd className="mt-1 break-words text-sm font-medium text-[#20332a]">{email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Phone</dt>
                <dd className="mt-1 text-sm font-medium text-[#20332a]">
                  {values.phone || "Not added"}
                </dd>
              </div>
            </dl>
          </div>

          {profileLinks.length ? (
            <div className="mt-7 border-t border-[#e8e4d8] pt-6">
              <h3 className="text-base font-semibold text-[#062b1f]">Links</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {profileLinks.map((link) => (
                  <a
                    className="rounded-full border border-[#d8d5c8] px-4 py-2 text-sm font-semibold text-[#20332a] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100]"
                    href={link.href}
                    key={link.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="p-6 sm:p-8" aria-labelledby="profile-preferences-summary-heading">
          <h3
            className="text-base font-semibold text-[#062b1f]"
            id="profile-preferences-summary-heading"
          >
            Job search preferences
          </h3>
          <dl className="mt-5 grid gap-6">
            <div>
              <dt className="text-xs font-semibold text-[#657167]">Target roles</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {values.desired_roles.length ? (
                  values.desired_roles.map((role) => (
                    <span className="rounded-full bg-[#e9f6c8] px-3 py-1.5 text-sm font-semibold text-[#20332a]" key={role}>
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#657167]">Not added</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[#657167]">Preferred locations</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {values.preferred_locations.length ? (
                  values.preferred_locations.map((location) => (
                    <span className="rounded-full bg-[#eff3df] px-3 py-1.5 text-sm font-semibold text-[#20332a]" key={location}>
                      {location}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#657167]">Not added</span>
                )}
              </dd>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Work mode</dt>
                <dd className="mt-2 text-sm font-medium text-[#20332a]">
                  {values.work_modes.length
                    ? values.work_modes.map(displayWorkMode).join(" · ")
                    : "Not added"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Employment type</dt>
                <dd className="mt-2 text-sm font-medium text-[#20332a]">
                  {values.employment_types.length
                    ? values.employment_types.map(displayEmploymentType).join(" · ")
                    : "Not added"}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
    </section>
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
  const [isEditing, setIsEditing] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );
  const completedSections = useMemo(
    () => [
      Boolean(values.name.trim() && values.headline.trim() && values.location.trim()),
      Boolean(values.professional_summary.trim()),
      Boolean(
        values.desired_roles.length &&
          values.work_modes.length &&
          values.employment_types.length &&
          values.availability,
      ),
      Boolean(values.linkedin_url.trim() || values.github_url.trim() || values.portfolio_url.trim()),
    ].filter(Boolean).length,
    [values],
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

  function updateListField(
    name: "desired_roles" | "preferred_locations" | "work_modes" | "employment_types",
    value: string[],
  ) {
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
        desired_roles: values.desired_roles,
        preferred_locations: values.preferred_locations,
        work_modes: values.work_modes,
        employment_types: values.employment_types,
        availability: values.availability || null,
        linkedin_url: values.linkedin_url.trim() || null,
        github_url: values.github_url.trim() || null,
        portfolio_url: values.portfolio_url.trim() || null,
      });
      const nextValues = valuesFromProfile(nextProfile);

      setProfile(nextProfile);
      setValues(nextValues);
      setSavedValues(nextValues);
      setSuccessMessage("Profile saved.");
      setIsEditing(false);

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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#062b1f]">Candidate profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
            Your professional identity and job-search preferences in one place.
          </p>
        </div>
        {!isEditing ? (
          <button
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d5c8] bg-white px-5 text-sm font-semibold text-[#20332a] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Edit profile
          </button>
        ) : null}
      </header>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {isEditing ? (
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

          <section aria-labelledby="profile-preferences-heading">
            <h2
              className="text-lg font-semibold text-[#062b1f]"
              id="profile-preferences-heading"
            >
              Job search preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#657167]">
              Shape the opportunities that fit you. Your résumé remains the source for your
              experience and skills.
            </p>

            <div className="mt-6 grid gap-5">
              <TagListInput
                description="Add up to 10 roles you want to pursue. Press Enter or comma after each one."
                error={fieldErrors.desired_roles}
                label="Target roles"
                name="desired_roles"
                onChange={(nextValues) => updateListField("desired_roles", nextValues)}
                placeholder="e.g. Backend Engineer"
                values={values.desired_roles}
              />
              <TagListInput
                description="Add cities, countries, or regions you would consider."
                error={fieldErrors.preferred_locations}
                label="Preferred locations"
                name="preferred_locations"
                onChange={(nextValues) => updateListField("preferred_locations", nextValues)}
                placeholder="e.g. Casablanca"
                values={values.preferred_locations}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <ChoicePills
                  description="Choose every work setting that suits you."
                  label="Work mode"
                  name="work_modes"
                  onChange={(nextValues) => updateListField("work_modes", nextValues)}
                  options={workModeOptions}
                  values={values.work_modes}
                />
                <ChoicePills
                  description="Choose the engagement types you would consider."
                  label="Employment type"
                  name="employment_types"
                  onChange={(nextValues) => updateListField("employment_types", nextValues)}
                  options={employmentTypeOptions}
                  values={values.employment_types}
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-[#20332a]">Availability</legend>
                <p className="mt-1 text-sm leading-5 text-[#657167]">
                  This is visible only in your profile for now; it prepares your account for
                  future matching.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {availabilityOptions.map((option) => {
                    const selected = values.availability === option.value;

                    return (
                      <button
                        aria-pressed={selected}
                        className={`min-h-12 rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${
                          selected
                            ? "border-[#588100] bg-[#eff9d1] text-[#20332a]"
                            : "border-[#d8d5c8] bg-white text-[#405047] hover:border-[#b7b29f] hover:bg-[#fbfaf4]"
                        }`}
                        key={option.value}
                        onClick={() => updateField("availability", selected ? "" : option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
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
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
              type="button"
            >
              Cancel
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
        ) : (
          <ProfileOverview
            email={profile?.email ?? ""}
            onEdit={() => setIsEditing(true)}
            values={values}
          />
        )}

        <aside className="rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <div className="rounded-2xl bg-[#eff3df] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-[#062b1f]">Profile readiness</h2>
              <span className="text-sm font-semibold text-[#3f5e00]">{completedSections}/4</span>
            </div>
            <div
              aria-label={`${completedSections} of 4 profile sections completed`}
              className="mt-3 h-2 overflow-hidden rounded-full bg-[#d8e3be]"
              role="progressbar"
              aria-valuemax={4}
              aria-valuemin={0}
              aria-valuenow={completedSections}
            >
              <div
                className="h-full rounded-full bg-[#588100] transition-[width] duration-200"
                style={{ width: `${completedSections * 25}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-5 text-[#405047]">
              Add your preferences so ApplyAI can support better opportunity matching later.
            </p>
          </div>

          <div className="my-6 h-px bg-[#e8e4d8]" />
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
