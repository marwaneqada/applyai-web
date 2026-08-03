"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

export const ANALYSIS_STATUS_EVENT = "applyai:analysis-status";
export const APPLICATION_STATUS_EVENT = "applyai:application-status";
export const APPLICATION_MATCH_EVENT = "applyai:application-match";
export const NOTIFICATION_CREATED_EVENT = "applyai:notification-created";

export type AnalysisStatusEvent = {
  analysis_id: number;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
};

export type ApplicationStatusEvent = {
  application_id: number;
  job_submission_id: number;
  status:
    | "saved"
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "hired"
    | "rejected";
  job_title: string;
};

export type ApplicationMatchEvent = {
  application_id: number;
  job_submission_id: number;
  match_status: "pending" | "processing" | "completed" | "failed";
  overall_score: number | null;
};

export type JobSubmissionUpdatedEvent = {
  job_id: number;
  submission_id: number;
  status: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
  match_status: "pending" | "processing" | "completed" | "failed" | null;
  overall_score: number | null;
};

export type NotificationCreatedEvent = {
  id: number;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  target_url: string | null;
  read_at: string | null;
  created_at: string | null;
};

export type RealtimeClient = Echo<"reverb">;

function apiOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    .replace(/\/+$/, "");
}

export async function createRealtimeClient(token: string): Promise<RealtimeClient | null> {
  let key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;

  try {
    const response = await fetch(`${apiOrigin()}/api/realtime/config`, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const payload = (await response.json()) as { data?: { key?: string | null } };
      key = payload.data?.key ?? key;
    }
  } catch {
    // Use the local public fallback when the API config endpoint is unavailable.
  }

  if (!key) {
    return null;
  }

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";
  const forceTLS = scheme === "https";
  const host = process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? (forceTLS ? 443 : 8080));

  window.Pusher = Pusher;

  return new Echo<"reverb">({
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    authEndpoint: `${apiOrigin()}/api/broadcasting/auth`,
    broadcaster: "reverb",
    enabledTransports: ["ws", "wss"],
    forceTLS,
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
  });
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}
