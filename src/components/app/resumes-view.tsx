"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  ApiError,
  deleteResume,
  listResumes,
  uploadResume,
  type Resume,
  type ResumeParseStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useTour } from "@/components/app/tour/tour-context";

type LoadStatus = "loading" | "ready" | "error";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const motionEase = [0.22, 1, 0.36, 1] as const;

const statusMeta: Record<ResumeParseStatus, { label: string; className: string }> = {
  success: {
    label: "Parsed",
    className: "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]",
  },
  pending: {
    label: "Processing",
    className: "border-[#ecdcae] bg-[#fbf3da] text-[#7a5a12]",
  },
  failed: {
    label: "Needs attention",
    className: "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]",
  },
};

function resolveStatusMeta(status: ResumeParseStatus) {
  return statusMeta[status] ?? statusMeta.pending;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function validateFile(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "That file isn't a PDF. Upload a PDF resume.";
  }

  if (file.size > MAX_FILE_BYTES) {
    return "That PDF is over 5 MB. Upload a smaller file.";
  }

  return null;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-transparent border-t-current ${className}`}
    />
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path
        d="M14 3v4a1 1 0 0 0 1 1h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 21a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8l5 5v12a1 1 0 0 1-1 1H6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResumesView() {
  const { token } = useAuth();
  const { completeAction } = useTour();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  const inputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await listResumes(token);
      setResumes(data);
      setLoadError("");
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "We couldn't load your resumes. Please try again.",
      );
      setLoadStatus("error");
    }
  }, [token]);

  useEffect(() => {
    // Defer into a microtask so the fetch (and its setState calls) don't run
    // synchronously within the effect body. Mirrors the app's auth-context.
    void Promise.resolve().then(load);
  }, [load]);

  function retry() {
    setLoadStatus("loading");
    setLoadError("");
    void load();
  }

  function pickFile(file: File | null) {
    setActionError("");

    if (!file) {
      setSelectedFile(null);
      setUploadError("");
      return;
    }

    const validationError = validateFile(file);
    setUploadError(validationError ?? "");
    setSelectedFile(validationError ? null : file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0] ?? null);
  }

  function openFileDialog() {
    inputRef.current?.click();
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile || !token || isUploading) {
      return;
    }

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const resume = await uploadResume(token, selectedFile);
      setResumes((current) => [resume, ...current]);
      setSelectedFile(null);
      resetInput();

      if (resume.parse_status === "success") {
        completeAction("resume_uploaded");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setUploadError(error.fieldErrors.resume ?? error.message);
      } else {
        setUploadError("Upload failed. Check your connection and try again.");
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token || deletingId !== null) {
      return;
    }

    setDeletingId(id);
    setActionError("");

    try {
      await deleteResume(token, id);
      setResumes((current) => current.filter((resume) => resume.id !== id));
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "We couldn't delete that resume. Please try again.",
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const headerMotion = reduceMotion
    ? {}
    : {
        animate: { opacity: 1, y: 0 },
        initial: { opacity: 0, y: 12 },
        transition: { duration: 0.5, ease: motionEase },
      };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
      <motion.header {...headerMotion}>
        <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
          Resumes
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">
          Your resume library
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
          Upload a PDF resume to analyze it against a job description. We read the
          text on upload, so you can reuse the same resume across analyses.
        </p>
      </motion.header>

      <motion.section
        aria-labelledby="upload-heading"
        className="mt-8 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-8"
        data-tour="resume-upload"
        {...(reduceMotion
          ? {}
          : {
              animate: { opacity: 1, y: 0 },
              initial: { opacity: 0, y: 12 },
              transition: { duration: 0.5, delay: 0.06, ease: motionEase },
            })}
      >
        <h2 className="text-lg font-semibold text-[#062b1f]" id="upload-heading">
          Upload a resume
        </h2>
        <p className="mt-1 text-sm text-[#657167]">PDF only, up to 5 MB.</p>

        <input
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />

        <div
          aria-label="Upload a PDF resume"
          className={`mt-5 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? "border-[#588100] bg-[#f5ffe0]"
              : "border-[#d8d5c8] bg-[#fbfaf4] hover:border-[#b7b29f]"
          }`}
          onClick={openFileDialog}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFileDialog();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef4df] text-[#315000]">
            <UploadIcon />
          </span>
          <p className="mt-4 text-sm font-semibold text-[#062b1f]">
            Drag &amp; drop your PDF here
          </p>
          <p className="mt-1 text-sm text-[#657167]">
            or <span className="font-semibold text-[#588100]">browse files</span>
          </p>
        </div>

        {selectedFile ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#e1ded1] bg-[#fbfaf4] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#405047] shadow-sm">
                <DocumentIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#062b1f]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#657167]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                disabled={isUploading}
                onClick={() => {
                  pickFile(null);
                  resetInput();
                }}
                type="button"
              >
                Remove
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#062b1f] px-5 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                disabled={isUploading}
                onClick={handleUpload}
                type="button"
              >
                {isUploading ? <Spinner className="h-4 w-4 text-[#a6f20f]" /> : null}
                {isUploading ? "Uploading..." : "Upload resume"}
              </button>
            </div>
          </div>
        ) : null}

        {uploadError ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium text-[#8b281f]"
          >
            {uploadError}
          </p>
        ) : null}
      </motion.section>

      <section aria-labelledby="library-heading" className="mt-10">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-[#062b1f]"
            id="library-heading"
          >
            Uploaded resumes
          </h2>
          {loadStatus === "ready" && resumes.length > 0 ? (
            <span className="text-sm text-[#657167]">
              {resumes.length} {resumes.length === 1 ? "file" : "files"}
            </span>
          ) : null}
        </div>

        {actionError ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium text-[#8b281f]"
          >
            {actionError}
          </p>
        ) : null}

        {loadStatus === "loading" ? (
          <ul className="mt-4 grid gap-3">
            {[0, 1, 2].map((key) => (
              <li
                key={key}
                className="h-24 animate-pulse rounded-[24px] border border-[#e8e4d8] bg-white"
              />
            ))}
          </ul>
        ) : null}

        {loadStatus === "error" ? (
          <div className="mt-4 rounded-[28px] border border-[#efc8bf] bg-[#fff7f4] p-6 text-center">
            <p className="text-sm font-medium text-[#8b281f]">{loadError}</p>
            <button
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={retry}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {loadStatus === "ready" && resumes.length === 0 ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-[#d8d5c8] bg-white p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef4df] text-[#315000]">
              <DocumentIcon />
            </span>
            <p className="mt-4 text-sm font-semibold text-[#062b1f]">
              No resumes yet
            </p>
            <p className="mt-1 text-sm text-[#657167]">
              Upload your first PDF resume to get started.
            </p>
          </div>
        ) : null}

        {loadStatus === "ready" && resumes.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            <AnimatePresence initial={false}>
              {resumes.map((resume) => {
                const meta = resolveStatusMeta(resume.parse_status);
                const isConfirming = confirmDeleteId === resume.id;
                const isDeleting = deletingId === resume.id;

                return (
                  <motion.li
                    key={resume.id}
                    layout={!reduceMotion}
                    {...(reduceMotion
                      ? {}
                      : {
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, scale: 0.98 },
                          initial: { opacity: 0, y: 8 },
                          transition: { duration: 0.28, ease: motionEase },
                        })}
                    className="rounded-[24px] border border-[#e1ded1] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f2ffd4] text-[#315000]">
                          <DocumentIcon />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#062b1f]">
                            {resume.original_filename}
                          </p>
                          <p className="mt-0.5 text-xs text-[#657167]">
                            {formatFileSize(resume.file_size)}
                            {formatDate(resume.created_at)
                              ? ` · Uploaded ${formatDate(resume.created_at)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:shrink-0">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>

                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#8b281f] px-4 text-xs font-semibold text-[#fff7f4] transition hover:bg-[#711f18] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                              disabled={isDeleting}
                              onClick={() => void handleDelete(resume.id)}
                              type="button"
                            >
                              {isDeleting ? (
                                <Spinner className="h-3.5 w-3.5 text-[#fff7f4]" />
                              ) : null}
                              {isDeleting ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                              className="inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold text-[#405047] transition hover:bg-[#eff3df] hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                              disabled={isDeleting}
                              onClick={() => setConfirmDeleteId(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            aria-label={`Delete ${resume.original_filename}`}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#e1ded1] px-3 text-xs font-semibold text-[#8b281f] transition hover:border-[#efc8bf] hover:bg-[#fff7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                            onClick={() => setConfirmDeleteId(resume.id)}
                            type="button"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {resume.parse_status === "failed" && resume.parse_error ? (
                      <p className="mt-3 rounded-xl bg-[#fff7f4] px-3 py-2 text-xs leading-5 text-[#8b281f]">
                        {resume.parse_error}
                      </p>
                    ) : null}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : null}
      </section>
    </main>
  );
}
