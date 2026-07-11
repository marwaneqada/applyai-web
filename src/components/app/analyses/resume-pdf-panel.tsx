"use client";

import { useState } from "react";
import {
  ApiError,
  generateResumePdf,
  getResumeStructureStatus,
  prepareResumeStructure,
  type ResumePdfTemplate,
} from "@/lib/api";

type Phase = "idle" | "structuring" | "generating";

const STRUCTURE_POLL_INTERVAL_MS = 2500;
const STRUCTURE_MAX_POLLS = 40;

const templates: { value: ResumePdfTemplate; label: string; description: string }[] = [
  { value: "harvard", label: "Harvard", description: "Classic, ATS-friendly single column." },
  { value: "modern", label: "Modern", description: "Accented headings, clean structure." },
  { value: "minimal", label: "Minimal", description: "Compact and understated." },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path d="M12 4v11m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ResumePdfPanel({
  analysisId,
  token,
}: {
  analysisId: number;
  token: string;
}) {
  const [template, setTemplate] = useState<ResumePdfTemplate>("harvard");
  const [phase, setPhase] = useState<Phase>("idle");
  const [structureReady, setStructureReady] = useState(false);
  const [error, setError] = useState("");

  const busy = phase !== "idle";

  async function pollStructureUntilReady() {
    for (let attempt = 0; attempt < STRUCTURE_MAX_POLLS; attempt += 1) {
      await delay(STRUCTURE_POLL_INTERVAL_MS);
      const state = await getResumeStructureStatus(token, analysisId);

      if (state.ready) {
        return true;
      }
    }

    return false;
  }

  async function handleGenerate() {
    if (busy) {
      return;
    }

    setError("");

    try {
      if (!structureReady) {
        setPhase("structuring");
        const prepared = await prepareResumeStructure(token, analysisId);
        const ready = prepared.ready ? true : await pollStructureUntilReady();

        if (!ready) {
          setError(
            "Preparing your resume is taking longer than expected. Please try again in a moment.",
          );
          setPhase("idle");
          return;
        }

        setStructureReady(true);
      }

      setPhase("generating");
      const blob = await generateResumePdf(token, analysisId, template);
      downloadBlob(blob, `resume-${template}-${analysisId}.pdf`);
      setPhase("idle");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't generate the PDF. Please try again.",
      );
      setPhase("idle");
    }
  }

  const buttonLabel =
    phase === "structuring"
      ? "Preparing resume..."
      : phase === "generating"
        ? "Generating PDF..."
        : "Download PDF";

  return (
    <section className="mt-6 rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#062b1f]">Tailored resume</h2>
          <p className="mt-1 text-sm text-[#657167]">
            Generate a formatted PDF built from your rewritten bullets. Pick a
            template.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {templates.map((option) => {
          const isSelected = template === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] ${
                isSelected
                  ? "border-[#588100] bg-[#f5ffe0] ring-4 ring-[#a6f20f]/20"
                  : "border-[#d8d5c8] bg-[#fbfaf4] hover:border-[#b7b29f] hover:bg-white"
              } ${busy ? "cursor-not-allowed opacity-70" : ""}`}
              disabled={busy}
              key={option.value}
              onClick={() => setTemplate(option.value)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full border ${
                    isSelected ? "border-[#588100]" : "border-[#c3bfad]"
                  }`}
                >
                  {isSelected ? (
                    <span className="h-2 w-2 rounded-full bg-[#4a8f16]" />
                  ) : null}
                </span>
                <span className="text-sm font-semibold text-[#062b1f]">
                  {option.label}
                </span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-[#657167]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl border border-[#efc8bf] bg-[#fff7f4] px-4 py-3 text-sm font-medium text-[#8b281f]"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#062b1f] px-6 text-sm font-semibold text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] transition hover:bg-[#031a13] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
          disabled={busy}
          onClick={() => void handleGenerate()}
          type="button"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-[#a6f20f]" />
          ) : (
            <DownloadIcon />
          )}
          {buttonLabel}
        </button>
        {phase === "structuring" ? (
          <span className="text-xs text-[#657167]">
            First time can take a few seconds.
          </span>
        ) : null}
      </div>
    </section>
  );
}
