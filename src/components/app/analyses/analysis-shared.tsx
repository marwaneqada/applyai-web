"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import type { AnalysisStatus, GapSeverity } from "@/lib/api";

export const motionEase = [0.22, 1, 0.36, 1] as const;

export function formatDate(iso: string | null) {
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

export const analysisStatusMeta: Record<
  AnalysisStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: "Queued",
    className: "border-[#ecdcae] bg-[#fbf3da] text-[#7a5a12]",
    dotClassName: "bg-[#c69220]",
  },
  processing: {
    label: "Analyzing",
    className: "border-[#cfe3f0] bg-[#eef6fb] text-[#215273]",
    dotClassName: "bg-[#2f80b8]",
  },
  completed: {
    label: "Completed",
    className: "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]",
    dotClassName: "bg-[#4a8f16]",
  },
  failed: {
    label: "Failed",
    className: "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]",
    dotClassName: "bg-[#b3402f]",
  },
};

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  const meta = analysisStatusMeta[status] ?? analysisStatusMeta.pending;
  const isActive = status === "pending" || status === "processing";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName} ${
          isActive ? "animate-pulse" : ""
        }`}
      />
      {meta.label}
    </span>
  );
}

export const severityMeta: Record<GapSeverity, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]",
  },
  important: {
    label: "Important",
    className: "border-[#ecdcae] bg-[#fbf3da] text-[#7a5a12]",
  },
  nice_to_have: {
    label: "Nice to have",
    className: "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]",
  },
};

export function scoreBand(value: number) {
  if (value >= 80) {
    return {
      label: "Strong match",
      ring: "#4a8f16",
      chip: "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]",
    };
  }

  if (value >= 60) {
    return {
      label: "Fair match",
      ring: "#c69220",
      chip: "border-[#ecdcae] bg-[#fbf3da] text-[#7a5a12]",
    };
  }

  return {
    label: "Needs work",
    ring: "#b3402f",
    chip: "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]",
  };
}

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ScoreRing({
  value,
  reduceMotion,
}: {
  value: number;
  reduceMotion: boolean;
}) {
  const clamped = clampScore(value);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const band = scoreBand(clamped);

  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke="#eef1e4"
          strokeWidth="10"
        />
        <motion.circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke={band.ring}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth="10"
          animate={{ strokeDashoffset: offset }}
          initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
          transition={reduceMotion ? undefined : { duration: 1, ease: motionEase }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold text-[#062b1f]">{clamped}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#87917f]">
          / 100
        </span>
      </div>
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  reduceMotion,
}: {
  label: string;
  value: number;
  reduceMotion: boolean;
}) {
  const clamped = clampScore(value);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#405047]">{label}</span>
        <span className="font-semibold text-[#062b1f]">{clamped}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#eef1e4]">
        <motion.div
          className="h-full rounded-full bg-[#3f7a12]"
          animate={{ width: `${clamped}%` }}
          initial={{ width: reduceMotion ? `${clamped}%` : 0 }}
          transition={reduceMotion ? undefined : { duration: 0.8, ease: motionEase }}
        />
      </div>
    </div>
  );
}

export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), resetMs);
      } catch {
        setCopied(false);
      }
    },
    [resetMs],
  );

  return { copied, copy };
}

export function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M12 8v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16.5h.01" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <rect height="13" rx="2" width="13" x="8" y="8" />
      <path
        d="M4 16V6a2 2 0 0 1 2-2h10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14m0 0-5-5m5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
