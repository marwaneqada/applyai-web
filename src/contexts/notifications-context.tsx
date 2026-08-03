"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { NOTIFICATION_CREATED_EVENT, type NotificationCreatedEvent } from "@/lib/realtime";

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function mergeNotification(items: AppNotification[], next: AppNotification) {
  return [next, ...items.filter((item) => item.id !== next.id)].slice(0, 20);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const sync = useCallback(async (showLoading: boolean) => {
    if (status !== "authenticated" || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const [list, count] = await Promise.all([
        listNotifications(token),
        getUnreadNotificationCount(token),
      ]);
      setNotifications(list.data);
      setUnreadCount(count);
    } catch {
      // Keep the last known state. Reverb or the next REST recovery pass can resync it.
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [status, token]);

  useEffect(() => {
    void Promise.resolve().then(() => sync(true));
  }, [sync]);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      return;
    }

    const recover = () => {
      if (document.visibilityState === "visible") {
        void sync(false);
      }
    };
    const interval = window.setInterval(recover, 10_000);

    window.addEventListener("focus", recover);
    window.addEventListener("online", recover);
    document.addEventListener("visibilitychange", recover);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", recover);
      window.removeEventListener("online", recover);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [status, sync, token]);

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const next = (event as CustomEvent<NotificationCreatedEvent>).detail;
      setNotifications((current) => mergeNotification(current, next));
      setUnreadCount((current) => current + 1);
    };

    window.addEventListener(NOTIFICATION_CREATED_EVENT, handleCreated);
    return () => window.removeEventListener(NOTIFICATION_CREATED_EVENT, handleCreated);
  }, []);

  const markRead = useCallback(async (id: number) => {
    if (!token) return;
    const current = notifications.find((item) => item.id === id);
    const updated = await markNotificationRead(token, id);
    setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
    if (current && !current.read_at && updated.read_at) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }
  }, [notifications, token]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, [token]);

  const value = useMemo(() => ({ notifications, unreadCount, loading, markRead, markAllRead }), [
    loading,
    markAllRead,
    markRead,
    notifications,
    unreadCount,
  ]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}
