"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { useTour } from "@/components/app/tour/tour-context";
import { accountHomePath } from "@/lib/routing";

const navItems = [
  { href: "/app", label: "Workspace" },
  { href: "/app/resumes", label: "Resumes" },
  { href: "/app/analyses", label: "Analyses" },
  { href: "/app/applications", label: "Applications" },
  { href: "/app/jobs", label: "Jobs" },
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
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const destination = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
  }, [router, status]);

  useEffect(() => {
    if (status === "authenticated" && user && user.account_type !== "candidate") {
      router.replace(accountHomePath(user.account_type));
    }
  }, [router, status, user]);

  useEffect(() => {
    function closeOnOutsidePress(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (status !== "authenticated" || user?.account_type !== "candidate") {
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
          <div className="relative flex items-center gap-1" ref={accountMenuRef}>
            <Link
              className="hidden max-w-36 truncate rounded-full px-2 py-2 text-sm font-semibold text-[#20332a] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] sm:block"
              href="/app/profile"
            >
              {user.name}
            </Link>
            <button
              aria-label="Open account menu"
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              className="grid size-10 shrink-0 place-items-center rounded-full text-left transition hover:bg-[#eff3df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              type="button"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#062b1f] text-sm font-semibold text-[#f7f5ec]" aria-hidden="true">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            </button>
            {isAccountMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-72 overflow-hidden rounded-2xl border border-[#e1ded1] bg-white shadow-[0_18px_45px_rgba(6,43,31,0.16)]" role="menu">
                <div className="border-b border-[#e8e4d8] px-5 py-4">
                  <p className="truncate text-sm font-semibold text-[#062b1f]">{user.name}</p>
                  <p className="mt-1 truncate text-sm text-[#657167]">{user.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${pathname === "/app/profile" ? "bg-[#eff3df] text-[#062b1f]" : "text-[#405047] hover:bg-[#fbfaf4] hover:text-[#062b1f]"}`}
                    href="/app/profile"
                    onClick={() => setIsAccountMenuOpen(false)}
                    role="menuitem"
                  >
                    <span aria-hidden="true">◉</span>
                    Profile & settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#405047] transition hover:bg-[#fbfaf4] hover:text-[#062b1f]"
                    onClick={() => { setIsAccountMenuOpen(false); startTour(); }}
                    role="menuitem"
                    type="button"
                  >
                    <span aria-hidden="true">?</span>
                    Guide
                  </button>
                </div>
                <div className="border-t border-[#e8e4d8] p-2">
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b33a2b] transition hover:bg-[#fff7f4]"
                    onClick={handleLogout}
                    role="menuitem"
                    type="button"
                  >
                    <span aria-hidden="true">↪</span>
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
