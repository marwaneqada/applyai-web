import type { ApplicationStatus } from "@/lib/api";

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const STATUS_ORDER: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

export const statusMeta: Record<
  ApplicationStatus,
  { label: string; dotClassName: string; chipClassName: string }
> = {
  saved: {
    label: "Saved",
    dotClassName: "bg-[#8a9385]",
    chipClassName: "border-[#e1ded1] bg-[#f4f2ea] text-[#4a5850]",
  },
  applied: {
    label: "Applied",
    dotClassName: "bg-[#2f80b8]",
    chipClassName: "border-[#cfe3f0] bg-[#eef6fb] text-[#215273]",
  },
  screening: {
    label: "Screening",
    dotClassName: "bg-[#557e71]",
    chipClassName: "border-[#cfded9] bg-[#edf5f2] text-[#235046]",
  },
  interview: {
    label: "Interview",
    dotClassName: "bg-[#c69220]",
    chipClassName: "border-[#ecdcae] bg-[#fbf3da] text-[#7a5a12]",
  },
  offer: {
    label: "Offer",
    dotClassName: "bg-[#4a8f16]",
    chipClassName: "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]",
  },
  hired: {
    label: "Hired",
    dotClassName: "bg-[#315000]",
    chipClassName: "border-[#cfe3aa] bg-[#eaf8c9] text-[#264500]",
  },
  rejected: {
    label: "Rejected",
    dotClassName: "bg-[#b3402f]",
    chipClassName: "border-[#efc8bf] bg-[#fff7f4] text-[#8b281f]",
  },
};

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

export function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KebabIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export function EditIcon() {
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
        d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon() {
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
