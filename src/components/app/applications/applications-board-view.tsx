"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useRef,
  type DragEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ApiError,
  deleteApplication,
  getApplicationBoard,
  moveApplication,
  type Application,
  type ApplicationBoard,
  type ApplicationStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeEvent } from "@/contexts/realtime-context";
import {
  APPLICATION_STATUS_EVENT,
  APPLICATION_MATCH_EVENT,
  type ApplicationStatusEvent,
  type ApplicationMatchEvent,
} from "@/lib/realtime";
import { useTour } from "@/components/app/tour/tour-context";
import { ApplicationFormModal } from "./application-form-modal";
import { ApplicationDetailsModal } from "./application-details-modal";
import {
  EditIcon,
  KebabIcon,
  PlusIcon,
  STATUS_ORDER,
  TrashIcon,
  formatDate,
  motionEase,
  originMeta,
  statusMeta,
  matchScoreClass,
} from "./applications-shared";

type LoadStatus = "loading" | "ready" | "error";
type ApplicationFilter = "all" | "applyai" | "external";
type ModalState =
  | { mode: "create" }
  | { mode: "edit"; application: Application }
  | { mode: "view"; application: Application }
  | null;
type MenuState = { id: number; top: number; left: number; maxHeight: number };
type DragOver = { status: ApplicationStatus; index: number };

const MENU_WIDTH = 208;

function cloneBoard(board: ApplicationBoard): ApplicationBoard {
  return {
    saved: [...board.saved],
    applied: [...board.applied],
    screening: [...board.screening],
    interview: [...board.interview],
    offer: [...board.offer],
    hired: [...board.hired],
    rejected: [...board.rejected],
  };
}

function findApp(board: ApplicationBoard, id: number): Application | undefined {
  for (const status of STATUS_ORDER) {
    const found = board[status].find((application) => application.id === id);

    if (found) {
      return found;
    }
  }

  return undefined;
}

function removeApp(board: ApplicationBoard, id: number): ApplicationBoard {
  const next = cloneBoard(board);

  for (const status of STATUS_ORDER) {
    next[status] = next[status].filter((application) => application.id !== id);
  }

  return next;
}

function upsertApp(board: ApplicationBoard, app: Application): ApplicationBoard {
  const inPlace = cloneBoard(board);
  const column = inPlace[app.status];
  const index = column.findIndex((application) => application.id === app.id);

  if (index >= 0) {
    column[index] = app;
    return inPlace;
  }

  const cleaned = removeApp(board, app.id);
  cleaned[app.status] = [...cleaned[app.status], app];
  return cleaned;
}

function sameIds(a: Application[], b: Application[]) {
  return a.length === b.length && a.every((item, index) => item.id === b[index].id);
}

function insertionIndex(container: HTMLElement, clientY: number) {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>("[data-card-id]"),
  );

  for (let i = 0; i < nodes.length; i += 1) {
    const rect = nodes[i].getBoundingClientRect();

    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }

  return nodes.length;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e1ded1] bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-semibold text-[#062b1f]">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-[#657167]">{label}</p>
    </div>
  );
}

export function ApplicationsBoardView() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const requestedApplicationId = Number(searchParams.get("application_id"));
  const { completeAction } = useTour();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const [board, setBoard] = useState<ApplicationBoard | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<DragOver | null>(null);
  const [applicationFilter, setApplicationFilter] = useState<ApplicationFilter>("all");
  const openedNotificationIdRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await getApplicationBoard(token);
      setBoard(data);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your applications. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useRealtimeEvent<ApplicationStatusEvent>(APPLICATION_STATUS_EVENT, () => {
    void load();
  });
  useRealtimeEvent<ApplicationMatchEvent>(APPLICATION_MATCH_EVENT, () => {
    void load();
  });

  useEffect(() => {
    if (!board || !Number.isInteger(requestedApplicationId) || requestedApplicationId <= 0) {
      return;
    }

    const application = findApp(board, requestedApplicationId);

    if (
      application &&
      modal === null &&
      openedNotificationIdRef.current !== requestedApplicationId
    ) {
      openedNotificationIdRef.current = requestedApplicationId;
      setModal({ mode: "view", application });
    }
  }, [board, modal, requestedApplicationId]);

  function closeMenu() {
    setMenu(null);
    setConfirmDeleteId(null);
  }

  function handleSaved(application: Application) {
    setBoard((current) => (current ? upsertApp(current, application) : current));
  }

  // Optimistic move used by both drag-drop and the card menu. `index` is the
  // insertion slot within the target column's rendered cards.
  const performMove = useCallback(
    async (appId: number, targetStatus: ApplicationStatus, index: number) => {
      if (!token) {
        return;
      }

      const snapshot = board;

      if (!snapshot) {
        return;
      }

      const dragging = findApp(snapshot, appId);

      if (!dragging) {
        return;
      }

      const columnCards = snapshot[targetStatus];
      const above = columnCards
        .slice(0, index)
        .filter((card) => card.id !== appId);
      const below = columnCards.slice(index).filter((card) => card.id !== appId);
      const after = above.length > 0 ? above[above.length - 1] : null;
      const before = below.length > 0 ? below[0] : null;

      const others = columnCards.filter((card) => card.id !== appId);
      const moved: Application = { ...dragging, status: targetStatus };
      const newColumn = [
        ...others.slice(0, above.length),
        moved,
        ...others.slice(above.length),
      ];

      if (dragging.status === targetStatus && sameIds(newColumn, columnCards)) {
        return;
      }

      const nextBoard = cloneBoard(snapshot);
      nextBoard[dragging.status] = nextBoard[dragging.status].filter(
        (card) => card.id !== appId,
      );
      nextBoard[targetStatus] = newColumn;

      setActionError("");
      setBoard(nextBoard);

      try {
        const updated = await moveApplication(token, appId, {
          status: targetStatus,
          after_application_id: after?.id ?? null,
          before_application_id: before?.id ?? null,
        });
        setBoard((current) => (current ? upsertApp(current, updated) : current));
      } catch (error) {
        setActionError(
          error instanceof ApiError
            ? error.message
            : "We couldn't move that application. It was returned to its place.",
        );
        setBoard(snapshot);
      }
    },
    [board, token],
  );

  const handleDelete = useCallback(
    async (application: Application) => {
      if (!token || !board) {
        return;
      }

      const snapshot = board;
      closeMenu();
      setActionError("");
      setBoard(removeApp(board, application.id));

      try {
        await deleteApplication(token, application.id);
      } catch (error) {
        setActionError(
          error instanceof ApiError
            ? error.message
            : "We couldn't delete that application. It was restored.",
        );
        setBoard(snapshot);
      }
    },
    [board, token],
  );

  function openMenu(event: React.MouseEvent<HTMLButtonElement>, id: number) {
    if (menu?.id === id) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.right - MENU_WIDTH, 8),
      window.innerWidth - MENU_WIDTH - 8,
    );

    setConfirmDeleteId(null);
    setMenu({
      id,
      left,
      top: rect.bottom + 6,
      maxHeight: window.innerHeight - rect.bottom - 16,
    });
  }

  function handleColumnDragOver(
    event: DragEvent<HTMLDivElement>,
    status: ApplicationStatus,
  ) {
    if (draggingId === null) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const index = insertionIndex(event.currentTarget, event.clientY);
    setDragOver((prev) =>
      prev && prev.status === status && prev.index === index
        ? prev
        : { status, index },
    );
  }

  function handleColumnDrop(
    event: DragEvent<HTMLDivElement>,
    status: ApplicationStatus,
  ) {
    event.preventDefault();

    if (draggingId === null) {
      return;
    }

    const index = insertionIndex(event.currentTarget, event.clientY);
    const appId = draggingId;
    setDraggingId(null);
    setDragOver(null);
    void performMove(appId, status, index);
  }

  const total = board
    ? STATUS_ORDER.reduce((sum, status) => sum + board[status].length, 0)
    : 0;
  const active = board ? total - board.rejected.length : 0;
  const menuApplication = menu && board ? findApp(board, menu.id) : undefined;
  const filterMeta: Record<ApplicationFilter, { label: string; count: number }> = {
    all: { label: "All applications", count: total },
    applyai: {
      label: "ApplyAI applications",
      count: board ? STATUS_ORDER.flatMap((status) => board[status]).filter((application) => application.origin === "applyai").length : 0,
    },
    external: {
      label: "Tracked externally",
      count: board ? STATUS_ORDER.flatMap((status) => board[status]).filter((application) => application.origin === "external").length : 0,
    },
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <motion.header
        className="flex flex-wrap items-end justify-between gap-4"
        {...(reduceMotion
          ? {}
          : {
              animate: { opacity: 1, y: 0 },
              initial: { opacity: 0, y: 12 },
              transition: { duration: 0.5, ease: motionEase },
            })}
      >
        <div>
          <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
            Applications
          </p>
          <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">
            Application tracker
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
            Drag a card between stages to update it, or use its menu. Everything
            saves automatically.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
          data-tour="add-application"
          onClick={() => setModal({ mode: "create" })}
          type="button"
        >
          <PlusIcon /> Add application
        </button>
      </motion.header>

      {loadStatus === "ready" && board ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total" value={total} />
          <StatTile label="Active" value={active} />
          <StatTile label="Interviews" value={board.interview.length} />
          <StatTile label="Offers" value={board.offer.length} />
        </div>
      ) : null}

      {actionError ? (
        <p
          aria-live="polite"
          className="mt-6 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium text-[#8b281f]"
        >
          {actionError}
        </p>
      ) : null}

      {loadStatus === "loading" ? (
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <div
              className="h-64 w-[280px] shrink-0 animate-pulse rounded-[24px] border border-[#e8e4d8] bg-white"
              key={status}
            />
          ))}
        </div>
      ) : null}

      {loadStatus === "error" ? (
        <div className="mt-8 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
          <p className="text-sm font-medium text-[#8b281f]">{loadError}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
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

      {loadStatus === "ready" && board ? (
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[#e1ded1] bg-white p-2" role="tablist" aria-label="Application origin">
          {(Object.keys(filterMeta) as ApplicationFilter[]).map((filter) => (
            <button
              aria-selected={applicationFilter === filter}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${applicationFilter === filter ? "bg-[#062b1f] text-[#f7f5ec]" : "text-[#657167] hover:bg-[#f4f2ea] hover:text-[#062b1f]"}`}
              key={filter}
              onClick={() => setApplicationFilter(filter)}
              role="tab"
              type="button"
            >
              {filterMeta[filter].label} <span className="ml-1 opacity-70">{filterMeta[filter].count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {loadStatus === "ready" && board ? (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const meta = statusMeta[status];
            const cards = board[status].filter((application) => applicationFilter === "all" || application.origin === applicationFilter);
            const isDropTarget = dragOver?.status === status;

            return (
              <section
                aria-label={meta.label}
                className={`flex w-[280px] shrink-0 flex-col rounded-[24px] border bg-[#f6f4ec] p-3 transition ${
                  isDropTarget ? "border-[#a6f20f]" : "border-[#e6e2d6]"
                }`}
                key={status}
              >
                <div className="flex items-center justify-between px-1 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
                    <h2 className="text-sm font-semibold text-[#062b1f]">
                      {meta.label}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#657167]">
                    {cards.length}
                  </span>
                </div>

                <div
                  className="mt-1 flex min-h-24 flex-1 flex-col gap-2.5 rounded-2xl p-0.5"
                  onDragOver={(event) => handleColumnDragOver(event, status)}
                  onDrop={(event) => handleColumnDrop(event, status)}
                >
                  {cards.length === 0 && !isDropTarget ? (
                    <p className="rounded-2xl border border-dashed border-[#d8d5c8] px-3 py-6 text-center text-xs text-[#a3a08f]">
                      Nothing here yet
                    </p>
                  ) : null}

                  {cards.map((application, index) => {
                    const isDragging = draggingId === application.id;

                    return (
                      <Fragment key={application.id}>
                        {isDropTarget && dragOver?.index === index ? (
                          <div className="h-0.5 rounded-full bg-[#a6f20f]" />
                        ) : null}

                        <article
                          className={`group cursor-grab rounded-2xl border border-[#e1ded1] bg-white p-3.5 shadow-sm transition active:cursor-grabbing ${
                            isDragging ? "opacity-40" : "hover:border-[#cfcbbb]"
                          }`}
                          data-card-id={application.id}
                          draggable
                          onClick={(event) => {
                            const target = event.target as HTMLElement;

                            if (target.closest("button, a")) {
                              return;
                            }

                            setModal({ mode: "view", application });
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOver(null);
                          }}
                          onDragStart={(event) => {
                            closeMenu();
                            setDraggingId(application.id);
                            event.dataTransfer.effectAllowed = "move";
                            try {
                              event.dataTransfer.setData(
                                "text/plain",
                                String(application.id),
                              );
                            } catch {
                              // Some browsers disallow setData; drag still works.
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setModal({ mode: "view", application });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#062b1f]">
                                {application.company_name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#657167]">
                                {application.job_title}
                              </p>
                            </div>
                            <button
                              aria-label="Application actions"
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#87917f] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                              onClick={(event) => openMenu(event, application.id)}
                              type="button"
                            >
                              <KebabIcon />
                            </button>
                          </div>

                          {application.origin === "applyai" && application.match?.status === "completed" && typeof application.match.overall_score === "number" ? (
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-[#657167]">Resume match</span>
                              <span className={`inline-flex items-baseline gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${matchScoreClass(application.match.overall_score)}`}>
                                <span>{Math.round(application.match.overall_score)}</span><span className="opacity-70">/100</span>
                              </span>
                            </div>
                          ) : null}

                          <span className={`mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold ${originMeta[application.origin].chipClassName}`}>
                            {application.origin === "applyai" ? "ApplyAI application" : "Tracked externally"}
                          </span>

                          {application.applied_date || application.contact_name ? (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {application.applied_date ? (
                                <span className="rounded-full bg-[#f4f2ea] px-2 py-0.5 text-[11px] font-medium text-[#657167]">
                                  {formatDate(application.applied_date)}
                                </span>
                              ) : null}
                              {application.contact_name ? (
                                <span className="max-w-full truncate rounded-full bg-[#f4f2ea] px-2 py-0.5 text-[11px] font-medium text-[#657167]">
                                  {application.contact_name}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {application.job_url ? (
                            <a
                              className="mt-2 block truncate text-[11px] font-semibold text-[#588100] transition hover:text-[#3f5e00]"
                              draggable={false}
                              href={application.job_url}
                              onClick={(event) => event.stopPropagation()}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {application.job_url}
                            </a>
                          ) : null}
                        </article>
                      </Fragment>
                    );
                  })}

                  {isDropTarget && dragOver?.index === cards.length ? (
                    <div className="h-0.5 rounded-full bg-[#a6f20f]" />
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {menu && menuApplication
        ? createPortal(
            <>
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={closeMenu}
                type="button"
              />
              <div
                className="fixed z-50 overflow-y-auto rounded-2xl border border-[#e1ded1] bg-white p-1.5 shadow-[0_18px_50px_rgba(6,43,31,0.16)]"
                style={{
                  left: menu.left,
                  maxHeight: menu.maxHeight,
                  top: menu.top,
                  width: MENU_WIDTH,
                }}
              >
                {confirmDeleteId === menuApplication.id ? (
                  <div className="p-2">
                    <p className="text-sm font-medium text-[#062b1f]">
                      Delete this application?
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-[#405047] transition hover:bg-[#eff3df]"
                        onClick={() => setConfirmDeleteId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="inline-flex h-8 items-center rounded-full bg-[#8b281f] px-3 text-xs font-semibold text-[#fff7f4] transition hover:bg-[#711f18]"
                        onClick={() => void handleDelete(menuApplication)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#20332a] transition hover:bg-[#eff3df]"
                      onClick={() => {
                        setModal({ application: menuApplication, mode: "edit" });
                        closeMenu();
                      }}
                      type="button"
                    >
                      <EditIcon /> Edit
                    </button>

                    <div className="my-1 border-t border-[#eee9db]" />
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a3a08f]">
                      Move to
                    </p>
                    {STATUS_ORDER.filter(
                      (status) => status !== menuApplication.status,
                    ).map((status) => (
                      <button
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#20332a] transition hover:bg-[#eff3df]"
                        key={status}
                        onClick={() => {
                          const targetLength = board ? board[status].length : 0;
                          closeMenu();
                          void performMove(menuApplication.id, status, targetLength);
                        }}
                        type="button"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${statusMeta[status].dotClassName}`}
                        />
                        {statusMeta[status].label}
                      </button>
                    ))}

                    <div className="my-1 border-t border-[#eee9db]" />
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#8b281f] transition hover:bg-[#fff7f4]"
                      onClick={() => setConfirmDeleteId(menuApplication.id)}
                      type="button"
                    >
                      <TrashIcon /> Delete
                    </button>
                  </>
                )}
              </div>
            </>,
            document.body,
          )
        : null}

      {modal?.mode === "view" ? (
        <ApplicationDetailsModal
          application={modal.application}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ mode: "edit", application: modal.application })}
        />
      ) : modal && token ? (
        <ApplicationFormModal
          initial={modal.mode === "edit" ? modal.application : undefined}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSaved={(application) => {
            handleSaved(application);

            if (modal.mode === "create") {
              completeAction("application_created");
            }
          }}
          token={token}
        />
      ) : null}
    </main>
  );
}
