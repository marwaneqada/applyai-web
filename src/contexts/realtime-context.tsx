"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  ANALYSIS_STATUS_EVENT,
  APPLICATION_STATUS_EVENT,
  NOTIFICATION_CREATED_EVENT,
  createRealtimeClient,
  type AnalysisStatusEvent,
  type ApplicationStatusEvent,
  type JobSubmissionUpdatedEvent,
  type NotificationCreatedEvent,
  type RealtimeClient,
} from "@/lib/realtime";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

const RealtimeContext = createContext<RealtimeClient | null>(null);

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status, token, user } = useAuth();
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !token || !user) {
      return;
    }

    const echo = createRealtimeClient(token);

    if (!echo) {
      return;
    }

    const channelName = `users.${user.id}`;
    const channel = echo.private(channelName);

    channel.listen(".analysis.status.updated", (payload: AnalysisStatusEvent) => {
      window.dispatchEvent(new CustomEvent(ANALYSIS_STATUS_EVENT, { detail: payload }));

      if (payload.status === "completed") {
        setToast({
          id: Date.now(),
          message: "Your resume analysis is ready.",
          tone: "success",
        });
      } else if (payload.status === "failed") {
        setToast({
          id: Date.now(),
          message: "Your resume analysis could not be completed.",
          tone: "error",
        });
      }
    });

    channel.listen(".application.status.updated", (payload: ApplicationStatusEvent) => {
      window.dispatchEvent(new CustomEvent(APPLICATION_STATUS_EVENT, { detail: payload }));
      setToast({
        id: Date.now(),
        message: `${payload.job_title} moved to ${titleCase(payload.status)}.`,
        tone: payload.status === "rejected" ? "error" : "info",
      });
    });

    channel.listen(".notification.created", (payload: NotificationCreatedEvent) => {
      window.dispatchEvent(new CustomEvent(NOTIFICATION_CREATED_EVENT, { detail: payload }));
    });

    Promise.resolve().then(() => setClient(echo));

    return () => {
      echo.leave(channelName);
      echo.disconnect();
      setClient(null);
    };
  }, [status, token, user]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 6500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <RealtimeContext.Provider value={client}>
      {children}
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_50px_rgba(6,43,31,0.18)] ${
            toast.tone === "error"
              ? "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]"
              : toast.tone === "success"
                ? "border-[#cfe3aa] bg-[#f2ffd4] text-[#315000]"
                : "border-[#cfded9] bg-white text-[#20332a]"
          }`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <span className="leading-6">{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            className="grid size-6 shrink-0 place-items-center rounded-full text-base leading-none opacity-70 transition hover:bg-black/5 hover:opacity-100"
            onClick={() => setToast(null)}
            type="button"
          >
            &times;
          </button>
        </div>
      ) : null}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeEvent<Payload>(
  eventName: string,
  listener: (payload: Payload) => void,
) {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const handle = (event: Event) => {
      listenerRef.current((event as CustomEvent<Payload>).detail);
    };

    window.addEventListener(eventName, handle);

    return () => window.removeEventListener(eventName, handle);
  }, [eventName]);
}

export function useCompanyRealtime(
  companyId: number | undefined,
  listener: (payload: JobSubmissionUpdatedEvent) => void,
) {
  const client = useContext(RealtimeContext);
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!client || !companyId) {
      return;
    }

    const channelName = `companies.${companyId}`;
    const channel = client.private(channelName);
    const handle = (payload: JobSubmissionUpdatedEvent) => listenerRef.current(payload);

    channel.listen(".job-submission.updated", handle);

    return () => {
      channel.stopListening(".job-submission.updated", handle);
      client.leave(channelName);
    };
  }, [client, companyId]);
}
