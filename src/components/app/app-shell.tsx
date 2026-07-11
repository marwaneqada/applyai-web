"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { useTour } from "@/components/app/tour/tour-context";

const navItems = [
  { href: "/app", label: "Workspace" },
  { href: "/app/resumes", label: "Resumes" },
  { href: "/app/analyses", label: "Analyses" },
  { href: "/app/applications", label: "Applications" },
] as const;

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf4] px-5 text-[#062b1f]">
      <div className="rounded-[28px] border border-[#e1ded1] bg-white px-8 py-6 text-center shadow-sm">
        <ApplyAiLogo className="justify-center" />
        <p className="mt-4 text-sm font-medium text-[#657167]">Checking your session...</p>
      </div>
    </main>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, status, user } = useAuth();
  const { start: startTour } = useTour();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const destination = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
  }, [router, status]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (status !== "authenticated") {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf4] text-[#062b1f]">
      <header className="border-b border-[#e8e4d8]/80 bg-[#fbfaf4]/88">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <ApplyAiLogo />
          <nav className="flex flex-wrap gap-2" aria-label="Application">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#062b1f] text-[#f7f5ec]"
                      : "text-[#405047] hover:bg-[#eff3df] hover:text-[#062b1f]"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm font-semibold text-[#405047] sm:inline">
              {user?.name}
            </span>
            <button
              className="hidden h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] sm:inline-flex"
              onClick={startTour}
              type="button"
            >
              Guide
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
