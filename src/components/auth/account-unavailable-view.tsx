"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { useAuth } from "@/contexts/auth-context";

export function AccountUnavailableView() {
  const { logout, status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user?.account_type === "candidate") {
      router.replace("/app");
    }
  }, [router, status, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (status === "loading" || user?.account_type === "candidate") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf4] px-5 text-[#062b1f]">
        <p className="text-sm font-semibold text-[#657167]">Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf4] px-5 py-10 text-[#062b1f]">
      <section className="w-full max-w-lg rounded-[28px] border border-[#e1ded1] bg-white p-7 shadow-[0_22px_70px_rgba(6,43,31,0.1)] sm:p-9">
        <ApplyAiLogo />
        <h1 className="mt-8 text-3xl font-semibold">This workspace is not available yet</h1>
        <p className="mt-3 text-sm leading-6 text-[#657167]">
          This release supports Candidate accounts. The HR workspace will be introduced separately.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {status === "authenticated" ? (
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={handleLogout}
              type="button"
            >
              Sign out
            </button>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              href="/login"
            >
              Sign in
            </Link>
          )}
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d5c8] bg-white px-6 text-sm font-semibold text-[#405047] transition hover:border-[#b7b29f] hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            href="/"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
