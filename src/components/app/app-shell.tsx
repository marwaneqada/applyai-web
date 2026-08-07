"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApplyAiLogo } from "@/components/auth/applyai-logo";
import { useTour } from "@/components/app/tour/tour-context";
import { accountHomePath } from "@/lib/routing";
import { NotificationBell } from "@/components/notifications/notification-bell";

type AppNavIconName = "workspace" | "resumes" | "analyses" | "applications" | "jobs" | "profile";

function AppNavIcon({ name }: { name: AppNavIconName }) {
  const paths: Record<AppNavIconName, ReactNode> = {
    workspace: <><path d="M3.5 10.5 10 4l6.5 6.5" /><path d="M5.5 9.5v6h9v-6M8 15.5v-3h4v3" /></>,
    resumes: <><path d="M6 3.5h6l3 3v10H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5Z" /><path d="M11.5 3.8V7h3.2M7.5 10h5M7.5 13h5" /></>,
    analyses: <><path d="m10 3 1.2 4.4L15.5 9l-4.3 1.6L10 15l-1.2-4.4L4.5 9l4.3-1.6L10 3ZM15.5 14.5l.5 1.8 1.8.7-1.8.7-.5 1.8-.5-1.8-1.8-.7 1.8-.7.5-1.8Z" /></>,
    applications: <><rect x="4" y="4" width="12" height="12" rx="1.5" /><path d="M7 8h6M7 11h4" /></>,
    jobs: <><path d="M4 6.5h12v9H4zM7 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 5v1.5M4 10h12" /><path d="M8 10v1h4v-1" /></>,
    profile: <><circle cx="10" cy="7" r="2.5" /><path d="M4.5 16c.8-2.6 2.6-4 5.5-4s4.7 1.4 5.5 4" /></>,
  };

  return <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">{paths[name]}</svg>;
}

const navItemsWithIcons = [
  { href: "/app", label: "Workspace", icon: "workspace" },
  { href: "/app/resumes", label: "Resumes", icon: "resumes" },
  { href: "/app/analyses", label: "Analyses", icon: "analyses" },
  { href: "/app/applications", label: "Applications", icon: "applications" },
  { href: "/app/jobs", label: "Jobs", icon: "jobs" },
] as const;

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf4] px-5 text-[#062b1f]">
      <div className="rounded-[28px] border border-[#e1ded1] bg-white px-8 py-6 text-center shadow-sm">
        <ApplyAiLogo className="justify-center" href="/login" />
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

  useEffect(() => {
    function closeForNotificationMenu() {
      setIsAccountMenuOpen(false);
    }

    window.addEventListener("applyai:account-menu-open", closeForNotificationMenu);
    return () => window.removeEventListener("applyai:account-menu-open", closeForNotificationMenu);
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
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e2e6e0] bg-[#f3f5f1] lg:flex" aria-label="Candidate workspace navigation">
          <div className="flex h-16 shrink-0 items-center border-b border-[#e2e6e0] px-7">
            <ApplyAiLogo href="/app" />
          </div>
          <div className="px-7 pt-4">
            <div>
              <p className="truncate text-sm font-semibold text-[#20332a]">{user.name}</p>
              <p className="mt-0.5 text-xs font-medium text-[#6a756d]">Candidate workspace</p>
            </div>
          </div>
          <nav className="mt-8 grid gap-1" aria-label="Candidate workspace sections">
            {navItemsWithIcons.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(`${item.href}/`));

              return <Link className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588100] ${isActive ? "bg-[#e9f3dd] text-[#315b18]" : "text-[#526059] hover:bg-white/70 hover:text-[#20332a]"}`} href={item.href} key={item.href}><AppNavIcon name={item.icon} /><span>{item.label}</span></Link>;
            })}
            <div className="mt-7 border-t border-[#e2e6e0] pt-5">
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.04em] text-[#7a847d]">Account</p>
              <Link className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${pathname === "/app/profile" ? "bg-[#e9f3dd] text-[#315b18]" : "text-[#526059] hover:bg-white/70 hover:text-[#20332a]"}`} href="/app/profile"><AppNavIcon name="profile" /><span>Profile</span></Link>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 h-16 border-b border-[#e8e4d8]/80 bg-[#fbfaf4]/95">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-4 lg:hidden"><ApplyAiLogo href="/app" /></div>
              <div className="ml-auto flex items-center gap-1" ref={accountMenuRef}>
                <NotificationBell />
                <button
                  aria-label="Open account menu"
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 shrink-0 items-center gap-2 rounded-full px-1.5 text-left whitespace-nowrap transition hover:bg-[#eff3df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                  onClick={() => {
                    if (!isAccountMenuOpen) window.dispatchEvent(new Event("applyai:notification-menu-open"));
                    setIsAccountMenuOpen((open) => !open);
                  }}
                  type="button"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#062b1f] text-sm font-semibold text-[#f7f5ec]" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                  <span className="hidden max-w-36 truncate text-sm font-semibold text-[#20332a] lg:block">{user.name}</span>
                  <svg aria-hidden="true" className={`size-3.5 text-[#657167] transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7"><path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                    Profile
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
            <div className="border-t border-[#edf0ec] px-4 py-1.5 lg:hidden"><nav className="flex min-w-max items-center gap-1 overflow-x-auto" aria-label="Candidate workspace sections">{navItemsWithIcons.map((item) => { const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(`${item.href}/`)); return <Link className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-[#e9f3dd] text-[#315b18]" : "text-[#526059]"}`} href={item.href} key={item.href}><AppNavIcon name={item.icon} /><span>{item.label}</span></Link>; })}</nav></div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
