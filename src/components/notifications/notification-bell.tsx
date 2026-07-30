"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/contexts/notifications-context";

function relativeTime(value: string | null) {
  if (!value) return "Recently";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationBell() {
  const { loading, markAllRead, markRead, notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative grid size-10 place-items-center rounded-full text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="text-lg">♢</span>
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 grid min-w-5 translate-x-1/4 -translate-y-1/4 place-items-center rounded-full bg-[#b33a2b] px-1 text-[11px] font-bold leading-5 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <section aria-label="Notifications" className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e1ded1] bg-white shadow-[0_18px_45px_rgba(6,43,31,0.16)]" role="dialog">
          <div className="flex items-center justify-between border-b border-[#e8e4d8] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#062b1f]">Notifications</h2>
              <p className="mt-0.5 text-xs text-[#657167]">Updates from your ApplyAI workspace</p>
            </div>
            {unreadCount > 0 ? (
              <button className="text-xs font-semibold text-[#588100] underline underline-offset-2" onClick={() => void markAllRead()} type="button">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-2 p-4" aria-label="Loading notifications">
                <div className="h-12 animate-pulse rounded-xl bg-[#eff3df]" />
                <div className="h-12 animate-pulse rounded-xl bg-[#eff3df]" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#657167]">You’re all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  className={`block border-b border-[#f0eee7] px-4 py-3 transition hover:bg-[#fbfaf4] ${notification.read_at ? "" : "bg-[#f7f9ee]"}`}
                  href={notification.target_url ?? "#"}
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read_at) void markRead(notification.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex gap-3">
                    <span aria-hidden="true" className={`mt-1 size-2 shrink-0 rounded-full ${notification.read_at ? "bg-[#d8d5c8]" : "bg-[#a6f20f]"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#20332a]">{notification.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[#657167]">{notification.message}</p>
                      <p className="mt-2 text-xs font-medium text-[#8a948b]">{relativeTime(notification.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
