"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  getHrProfile,
  isUnauthorizedError,
  updateHrProfile,
  type HrProfile,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export function HrProfilePanel({
  onCompanyRenamed,
}: {
  onCompanyRenamed: (name: string) => void;
}) {
  const { clearSession, refreshUser, token } = useAuth();
  const [profile, setProfile] = useState<HrProfile | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const next = await getHrProfile(token);
      setProfile(next);
      setName(next.name);
      setCompanyName(next.company.name);
      setError("");
    } catch (cause) {
      if (isUnauthorizedError(cause)) {
        clearSession();
      } else {
        setError(cause instanceof ApiError ? cause.message : "We couldn't load your HR profile.");
      }
    }
  }, [clearSession, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !profile || saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const next = await updateHrProfile(token, {
        name: name.trim(),
        ...(profile.can_manage_company ? { company_name: companyName.trim() } : {}),
      });
      setProfile(next);
      setName(next.name);
      setCompanyName(next.company.name);
      onCompanyRenamed(next.company.name);
      await refreshUser();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "We couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile && !error) {
    return <div className="h-56 animate-pulse rounded-2xl bg-[#eff3df]" />;
  }

  return (
    <section>
      <div>
        <h2 className="text-xl font-semibold">HR profile</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#405047]">
          Manage the identity candidates and teammates associate with this hiring workspace.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-4 text-sm font-medium text-[#8b281f]" role="alert">
          {error}
        </div>
      ) : null}

      {profile ? (
        <form className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" onSubmit={submit}>
          <div className="grid gap-5">
            <label className="text-sm font-semibold text-[#20332a]">
              Full name
              <input
                className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 text-sm font-medium outline-none focus:border-[#588100] focus:ring-4 focus:ring-[#a6f20f]/20"
                maxLength={255}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                required
                value={name}
              />
            </label>
            <label className="text-sm font-semibold text-[#20332a]">
              Work email
              <input
                className="mt-2 h-11 w-full rounded-xl border border-[#e1ded1] bg-[#f4f2ea] px-3 text-sm font-medium text-[#657167]"
                disabled
                value={profile.email}
              />
              <span className="mt-1.5 block text-xs font-medium text-[#657167]">Email changes are disabled for account security.</span>
            </label>
            <label className="text-sm font-semibold text-[#20332a]">
              Company name
              <input
                className="mt-2 h-11 w-full rounded-xl border border-[#d8d5c8] bg-white px-3 text-sm font-medium outline-none disabled:bg-[#f4f2ea] disabled:text-[#657167] focus:border-[#588100] focus:ring-4 focus:ring-[#a6f20f]/20"
                disabled={!profile.can_manage_company}
                maxLength={255}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  setSaved(false);
                }}
                required
                value={companyName}
              />
              {!profile.can_manage_company ? (
                <span className="mt-1.5 block text-xs font-medium text-[#657167]">Only workspace owners can rename the company.</span>
              ) : null}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="h-11 rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] disabled:opacity-60"
                disabled={saving || !name.trim() || (profile.can_manage_company && !companyName.trim())}
                type="submit"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
              {saved ? <span className="text-sm font-semibold text-[#4a7b12]" role="status">Profile saved</span> : null}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e1ded1] bg-[#fbfaf4] p-5">
            <div className="grid size-14 place-items-center rounded-full bg-[#062b1f] text-xl font-semibold text-white">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <p className="mt-4 text-lg font-semibold text-[#062b1f]">{profile.name}</p>
            <p className="mt-1 text-sm text-[#405047]">{profile.company.name}</p>
            <dl className="mt-5 grid gap-4 border-t border-[#e1ded1] pt-5">
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Workspace role</dt>
                <dd className="mt-1 text-sm font-semibold capitalize text-[#20332a]">{profile.membership_role}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#657167]">Member since</dt>
                <dd className="mt-1 text-sm font-semibold text-[#20332a]">
                  {profile.joined_at
                    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(profile.joined_at))
                    : "Workspace created"}
                </dd>
              </div>
            </dl>
          </aside>
        </form>
      ) : null}
    </section>
  );
}
