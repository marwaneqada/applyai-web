"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  getApplicationBoard,
  type Application,
  type ApplicationStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/contexts/notifications-context";
import { useRealtimeEvent } from "@/contexts/realtime-context";
import {
  APPLICATION_MATCH_EVENT,
  APPLICATION_STATUS_EVENT,
  type ApplicationMatchEvent,
  type ApplicationStatusEvent,
} from "@/lib/realtime";
import { ApplicationDetailsModal } from "./application-details-modal";
import {
  STATUS_ORDER,
  formatDate,
  matchScoreClass,
  statusMeta,
} from "./applications-shared";

type LoadStatus = "loading" | "ready" | "error";
type StatusFilter = "all" | ApplicationStatus;

export function MyApplicationsView() {
  const { token } = useAuth();
  const { notifications } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = Number(searchParams.get("application_id"));
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const board = await getApplicationBoard(token);
      const nativeApplications = STATUS_ORDER
        .flatMap((status) => board[status])
        .filter((application) => application.origin === "applyai")
        .sort((a, b) => {
          const aTime = new Date(a.applied_date ?? a.created_at ?? 0).getTime();
          const bTime = new Date(b.applied_date ?? b.created_at ?? 0).getTime();
          return bTime - aTime;
        });

      setApplications(nativeApplications);
      setSelected((current) => {
        const selectedId =
          Number.isInteger(requestedId) && requestedId > 0
            ? requestedId
            : current?.id;

        return selectedId
          ? nativeApplications.find((application) => application.id === selectedId) ?? null
          : null;
      });
      setErrorMessage("");
      setLoadStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your applications. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [requestedId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useRealtimeEvent<ApplicationStatusEvent>(APPLICATION_STATUS_EVENT, (payload) => {
    setApplications((current) => current.map((application) =>
      application.id === payload.application_id
        ? { ...application, status: payload.status }
        : application,
    ));
    setSelected((current) => current && current.id === payload.application_id
      ? { ...current, status: payload.status }
      : current);
  });
  useRealtimeEvent<ApplicationMatchEvent>(APPLICATION_MATCH_EVENT, () => {
    void load();
  });

  const notificationStatuses = useMemo(() => {
    const statuses = new Map<number, ApplicationStatus>();

    for (const notification of notifications) {
      if (notification.type !== "application.status_changed") {
        continue;
      }

      const applicationId = notification.payload.application_id;
      const status = notification.payload.status;

      if (typeof applicationId === "number" && typeof status === "string") {
        statuses.set(applicationId, status as ApplicationStatus);
      }
    }

    return statuses;
  }, [notifications]);

  const resolvedApplications = useMemo(
    () => applications.map((application) => {
      const status = notificationStatuses.get(application.id);
      return status ? { ...application, status } : application;
    }),
    [applications, notificationStatuses],
  );

  const visibleApplications = useMemo(
    () =>
      statusFilter === "all"
        ? resolvedApplications
        : resolvedApplications.filter((application) => application.status === statusFilter),
    [resolvedApplications, statusFilter],
  );

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_ORDER.map((status) => [
          status,
          resolvedApplications.filter((application) => application.status === status).length,
        ]),
      ) as Record<ApplicationStatus, number>,
    [resolvedApplications],
  );

  const resolvedSelected = useMemo(
    () => selected
      ? { ...selected, status: notificationStatuses.get(selected.id) ?? selected.status }
      : null,
    [notificationStatuses, selected],
  );

  const selectedCandidateMessage = useMemo(() => {
    if (!resolvedSelected) {
      return null;
    }

    const notification = notifications.find(
      (item) =>
        (item.type === "application.status_changed" || item.type === "application.message") &&
        item.payload.application_id === resolvedSelected.id,
    );

    if (!notification) {
      return null;
    }

    const message = notification.payload.candidate_message;

    return typeof message === "string"
      ? message
      : notification.type === "application.message"
        ? notification.message
        : null;
  }, [notifications, resolvedSelected]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5" data-tour="applications-overview">
        <div>
          <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
            Candidate applications
          </p>
          <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">My applications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#405047]">
            Applications submitted through ApplyAI. Hiring teams control each stage, and updates appear here automatically.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
          href="/app/jobs"
        >
          Browse jobs
        </Link>
      </header>

      {loadStatus === "loading" ? (
        <div className="mt-8 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div className="h-28 animate-pulse rounded-2xl border border-[#e1ded1] bg-white" key={item} />
          ))}
        </div>
      ) : null}

      {loadStatus === "error" ? (
        <div className="mt-8 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{errorMessage}</p>
          <button
            className="mt-4 rounded-full border border-[#d8d5c8] bg-white px-5 py-2.5 text-sm font-semibold text-[#062b1f]"
            onClick={() => {
              setLoadStatus("loading");
              void load();
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === "ready" ? (
        <>
          <div className="mt-8 flex flex-wrap gap-2 border-b border-[#e1ded1] pb-4" aria-label="Filter applications by status">
            <button
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${statusFilter === "all" ? "bg-[#062b1f] text-white" : "bg-white text-[#405047] hover:bg-[#f4f2ea]"}`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              All {applications.length}
            </button>
            {STATUS_ORDER.filter((status) => statusCounts[status] > 0).map((status) => (
              <button
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${statusFilter === status ? "bg-[#062b1f] text-white" : "bg-white text-[#405047] hover:bg-[#f4f2ea]"}`}
                key={status}
                onClick={() => setStatusFilter(status)}
                type="button"
              >
                {statusMeta[status].label} {statusCounts[status]}
              </button>
            ))}
          </div>

          {applications.length === 0 ? (
            <section className="mt-8 rounded-[28px] border border-[#e1ded1] bg-white px-6 py-14 text-center">
              <h2 className="text-xl font-semibold text-[#062b1f]">No ApplyAI applications yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#405047]">
                When you apply to a job through ApplyAI, its hiring status and match analysis will appear here.
              </p>
              <Link className="mt-6 inline-flex rounded-full bg-[#062b1f] px-5 py-2.5 text-sm font-semibold text-white" href="/app/jobs">
                Find a job
              </Link>
            </section>
          ) : visibleApplications.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-[#e1ded1] bg-white p-6 text-center text-sm text-[#405047]">
              No applications in this stage.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e1ded1] bg-white">
              <ul className="divide-y divide-[#eee9db]">
                {visibleApplications.map((application) => {
                  const score = application.match?.overall_score;
                  const hasScore =
                    application.match?.status === "completed" && typeof score === "number";

                  return (
                    <li key={application.id}>
                      <button
                        className="flex w-full flex-wrap items-center gap-4 px-5 py-5 text-left transition hover:bg-[#fbfaf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a6f20f] sm:flex-nowrap"
                        onClick={() => setSelected(application)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-semibold text-[#062b1f]">{application.job_title}</span>
                          <span className="mt-1 block truncate text-sm text-[#405047]">
                            {application.company_name}
                            {formatDate(application.applied_date) ? ` · Applied ${formatDate(application.applied_date)}` : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {hasScore ? (
                            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${matchScoreClass(score)}`}>
                              {Math.round(score)}/100 match
                            </span>
                          ) : null}
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta[application.status].chipClassName}`}>
                            <span className={`size-2 rounded-full ${statusMeta[application.status].dotClassName}`} />
                            {statusMeta[application.status].label}
                          </span>
                          <span aria-hidden="true" className="text-lg text-[#87917f]">›</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : null}

      {resolvedSelected ? (
        <ApplicationDetailsModal
          application={resolvedSelected}
          candidateMessage={selectedCandidateMessage}
          onClose={() => {
            setSelected(null);

            if (Number.isInteger(requestedId) && requestedId > 0) {
              router.replace("/app/applications", { scroll: false });
            }
          }}
        />
      ) : null}
    </main>
  );
}
