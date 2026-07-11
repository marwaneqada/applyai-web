import type { ReactNode } from "react";
import { REVIEW_NOTES, SCORE_BREAKDOWN } from "@/constants/landing";

type StoryMockupVariant = "intake" | "job" | "score" | "rewrite" | "export" | "kanban";

function WindowControls({ live = false }: { live?: boolean }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-[#d8d5c8]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#d8d5c8]" />
      <span
        className={`h-2.5 w-2.5 rounded-full bg-[#a6f20f] ${
          live ? "hero-live-dot" : ""
        }`}
      />
    </div>
  );
}

function ScoreDots({ active = 5 }: { active?: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          className={`h-2 w-2 rounded-full ${
            index < active ? "hero-live-dot bg-[#19c56b]" : "bg-[#d8d5c8]"
          }`}
          key={index}
          style={index < active ? { animationDelay: `${index * 0.18}s` } : undefined}
        />
      ))}
    </div>
  );
}

function SignalRows() {
  return (
    <div className="space-y-3">
      {[
        ["Laravel APIs", "Matched"],
        ["Docker", "Missing"],
        ["CI/CD", "Missing"],
      ].map(([label, value]) => {
        const isLiveKeyword = label === "Docker";

        return (
          <div
            className={`flex items-center justify-between rounded-2xl border border-[#e6e2d5] bg-[#fbfaf4] px-4 py-3 ${
              isLiveKeyword ? "hero-row-live" : ""
            }`}
            key={label}
          >
            <span className="text-sm font-medium text-[#20332a]">{label}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                value === "Missing"
                  ? "bg-[#f2ffd4] text-[#315000]"
                  : "bg-white text-[#405047]"
              } ${isLiveKeyword ? "hero-keyword-live" : ""}`}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HeroProductMockup({ score = "91%" }: { score?: ReactNode }) {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[calc(100vw-2.5rem)] sm:max-w-full lg:max-w-7xl">
      <div className="w-full min-w-0 overflow-hidden rounded-[32px] border border-[#d8d5c8] bg-white shadow-[0_30px_90px_rgba(6,43,31,0.14)]">
        <div className="flex items-center justify-between border-b border-[#ebe8dc] bg-[#fbfaf4] px-5 py-4">
          <WindowControls live />
          <p className="min-w-0 truncate px-3 text-sm font-semibold text-[#20332a]">
            ApplyAI workspace
          </p>
          <span className="hero-status-live hidden rounded-full bg-[#eaf8d6] px-3 py-1 text-xs font-semibold text-[#315000] sm:inline-flex">
            resume.pdf
          </span>
        </div>

        <div className="grid min-h-[410px] min-w-0 gap-0 sm:min-h-[440px] lg:min-h-[470px] lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="min-w-0 border-b border-[#ebe8dc] bg-[#062b1f] p-6 text-[#f7f5ec] lg:border-b-0 lg:border-r lg:border-[#103d2e]">
            <p className="text-sm text-[#cbd8c5]">Target job</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
              Backend Developer at Acme
            </h3>
            <div className="mt-7 min-w-0 rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-[#cbd8c5]">Match score</p>
                  <p className="mt-2 text-6xl font-semibold leading-none tabular-nums">
                    {score}
                  </p>
                </div>
                <ScoreDots active={5} />
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="hero-score-fill relative h-2 w-[91%] origin-left overflow-hidden rounded-full bg-[#a6f20f]">
                  <span className="hero-score-shimmer absolute inset-y-0 left-0 w-10 bg-white/60" />
                </div>
              </div>
            </div>
            <div className="mt-5 grid min-w-0 grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-2xl font-semibold">8</p>
                <p className="mt-1 text-xs text-[#cbd8c5]">rewritten bullets</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-2xl font-semibold">2</p>
                <p className="mt-1 text-xs text-[#cbd8c5]">missing keywords</p>
              </div>
            </div>
          </aside>

          <div className="hidden min-w-0 gap-5 bg-white p-5 sm:grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="min-w-0 rounded-[24px] border border-[#e6e2d5] bg-[#fbfaf4] p-5">
              <p className="text-sm font-semibold text-[#405047]">Job description</p>
              <h4 className="mt-2 text-xl font-semibold text-[#062b1f]">
                Required keywords
              </h4>
              <div className="mt-5">
                <SignalRows />
              </div>
            </div>

            <div className="min-w-0 rounded-[24px] border border-[#e6e2d5] bg-white p-5">
              <p className="text-sm font-semibold text-[#405047]">AI suggestions</p>
              <h4 className="mt-2 text-xl font-semibold text-[#062b1f]">
                Next application steps
              </h4>
              <div className="mt-5 space-y-3">
                {REVIEW_NOTES.map((note, index) => (
                  <div
                    className={`rounded-2xl border border-[#e6e2d5] bg-[#fbfaf4] p-4 text-sm leading-6 text-[#405047] ${
                      index === 1 ? "hero-suggestion-live" : ""
                    }`}
                    key={note}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntakeMockup() {
  return (
    <div className="mx-auto max-w-[620px]">
      <div className="rounded-[24px] border-[7px] border-[#cfe7a9] bg-white p-4 shadow-[0_18px_50px_rgba(20,45,15,0.14)]">
        <div className="flex items-center gap-4 rounded-[18px] bg-white">
          <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-[#dfe9d2] text-xl font-semibold text-[#062b1f]">
            PDF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-[#062b1f]">
              resume.pdf
            </p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6d776f]">Type</p>
                <p className="font-semibold text-[#20332a]">PDF</p>
              </div>
              <div>
                <p className="text-xs text-[#6d776f]">Size</p>
                <p className="font-semibold text-[#20332a]">214 KB</p>
              </div>
              <div>
                <p className="text-xs text-[#6d776f]">Parse status</p>
                <p className="font-semibold text-[#20332a]">success</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-[#e6e2d5] bg-[#fbfaf4] p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-[#062b1f] px-3 py-1.5 font-semibold text-white">
              Resume uploaded
            </span>
            <span className="rounded-full border border-[#e6e2d5] bg-white px-3 py-1.5 font-semibold text-[#405047]">
              Ready for analysis
            </span>
          </div>
          <div className="mt-4 rounded-[14px] bg-white px-4 py-3 text-sm leading-6 text-[#20332a]">
            Resume uploaded: resume.pdf. Parse status: success.
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[420px] items-center justify-between rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white">
        <span>Select resume for analysis</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#062b1f]">
          Go
        </span>
      </div>
    </div>
  );
}

function JobDescriptionMockup() {
  return (
    <div className="mx-auto max-w-[620px]">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_50px_rgba(20,45,15,0.12)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#405047]">Job description</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#062b1f]">
              Backend Developer at Acme
            </h3>
          </div>
          <span className="rounded-full bg-[#f2ffd4] px-3 py-1 text-xs font-semibold text-[#315000]">
            Pasted
          </span>
        </div>

        <div className="mt-5 rounded-[18px] border border-[#e6e2d5] bg-[#fbfaf4] p-4">
          <p className="text-sm leading-6 text-[#405047]">
            We need a backend developer with Laravel API experience, Docker,
            CI/CD, queues, and production deployment ownership.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Laravel APIs", "Docker", "CI/CD", "Queues"].map((keyword) => (
            <div
              className="rounded-[16px] border border-[#e6e2d5] bg-white px-4 py-3 text-sm font-semibold text-[#20332a]"
              key={keyword}
            >
              {keyword}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[420px] items-center justify-between rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white">
        <span>Compare against resume.pdf</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#062b1f]">
          Go
        </span>
      </div>
    </div>
  );
}

function ScoreMockup() {
  return (
    <div className="mx-auto max-w-[620px] rounded-[24px] border border-white/10 bg-white/[0.08] p-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#062b1f] px-3 py-2 text-sm font-semibold text-white">
        <span className="flex gap-1 rounded-full bg-[#cbffd2] px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#19c56b]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#19c56b]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#19c56b]" />
        </span>
        Job Match Analysis
      </div>

      <div className="mt-5 rounded-[18px] bg-[#164f29] p-5 text-[#eaf5e5]">
        <p className="text-sm text-[#b8cbb3]">91% match score</p>
        <p className="mt-3 text-lg leading-7">
          Strong Laravel API and queue experience. Close the gap by adding Docker
          and CI/CD evidence before applying.
        </p>
      </div>

      <div className="mt-4 rounded-[18px] bg-[#d6ffd6] p-5 text-[#20332a]">
        <p className="text-sm font-semibold text-[#315000]">Resume match result</p>
        <p className="mt-3 text-base leading-7">
          Missing keywords: Docker, CI/CD.
        </p>
        <div className="mt-5 grid gap-3">
          {SCORE_BREAKDOWN.map((item) => (
            <div className="flex items-center justify-between gap-4 text-sm" key={item.label}>
              <span className="font-semibold">{item.label}</span>
              <span className="rounded-full bg-white/70 px-3 py-1 font-semibold">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewriteMockup() {
  return (
    <div className="mx-auto max-w-[620px]">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_50px_rgba(20,45,15,0.12)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#405047]">AI rewrite suggestions</p>
          <span className="rounded-full bg-[#f2ffd4] px-3 py-1 text-xs font-semibold text-[#315000]">
            Role-specific
          </span>
        </div>

        <div className="mt-5 rounded-[18px] border border-[#e6e2d5] bg-[#fbfaf4] p-4">
          <p className="text-xs font-semibold text-[#6d776f]">Before</p>
          <p className="mt-2 text-sm leading-6 text-[#405047]">
            Built APIs and helped with backend tasks.
          </p>
        </div>

        <div className="mt-4 rounded-[18px] bg-[#062b1f] p-5 text-white">
          <p className="text-xs font-semibold text-[#cbd8c5]">After</p>
          <p className="mt-3 text-base leading-7">
            Built production Laravel APIs with queued jobs, Docker-based local
            environments, and CI/CD release checks for customer-facing features.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Rewritten bullets", "Cover letter draft", "Keyword gaps"].map((item) => (
            <span
              className="rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExportMockup() {
  return (
    <div className="mx-auto max-w-[620px]">
      <div className="rounded-[26px] border-[7px] border-[#cfe7a9] bg-white p-5 shadow-[0_18px_50px_rgba(20,45,15,0.14)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#405047]">Resume PDF</p>
            <p className="mt-1 text-xl font-semibold text-[#062b1f]">
              backend-developer-minimal.pdf
            </p>
          </div>
          <span className="rounded-full bg-[#f2ffd4] px-3 py-1 text-xs font-semibold text-[#315000]">
            Ready
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {["Harvard template", "Modern template", "Minimal template"].map(
            (item) => (
              <div
                className="flex items-center justify-between rounded-[16px] border border-[#e6e2d5] bg-[#fbfaf4] px-4 py-3 text-sm font-semibold text-[#20332a]"
                key={item}
              >
                <span>{item}</span>
                <span className="h-2 w-2 rounded-full bg-[#19c56b]" />
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[420px] items-center justify-between rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white">
        <span>Download PDF and track job</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#062b1f]">
          Go
        </span>
      </div>
    </div>
  );
}

function KanbanMiniMockup() {
  const columns = [
    ["Saved", "Backend Developer", "91% match"],
    ["Applied", "SaaS API Engineer", "PDF sent"],
    ["Interview", "Platform Developer", "Call booked"],
    ["Offer", "Product Engineer", "Offer review"],
    ["Rejected", "Legacy PHP role", "Closed"],
  ];

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="rounded-[24px] bg-white p-4 shadow-[0_18px_50px_rgba(20,45,15,0.12)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#405047]">Application tracker</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#062b1f]">
              Kanban board
            </h3>
          </div>
          <span className="rounded-full bg-[#f2ffd4] px-3 py-1 text-xs font-semibold text-[#315000]">
            Saved
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {columns.map(([status, title, detail]) => (
            <div
              className="min-h-[150px] rounded-[16px] border border-[#e6e2d5] bg-[#fbfaf4] p-3"
              key={status}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#062b1f]">{status}</p>
                <span className="h-2 w-2 rounded-full bg-[#19c56b]" />
              </div>
              <div className="mt-4 rounded-[14px] bg-white p-3">
                <p className="text-xs font-semibold leading-5 text-[#062b1f]">
                  {title}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-[#657167]">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryProductMockup({
  variant,
}: {
  variant: StoryMockupVariant;
}) {
  const panelClass: Record<StoryMockupVariant, string> = {
    intake: "bg-[#5c891d]",
    job: "bg-[#063f18]",
    score: "bg-[#063f18]",
    rewrite: "bg-[#5c891d]",
    export: "bg-[#063f18]",
    kanban: "bg-[#5c891d]",
  };

  return (
    <div
      className={`grid min-h-[430px] place-items-center rounded-[18px] p-8 shadow-[0_28px_80px_rgba(6,43,31,0.12)] ${panelClass[variant]}`}
    >
      {variant === "intake" ? <IntakeMockup /> : null}
      {variant === "job" ? <JobDescriptionMockup /> : null}
      {variant === "score" ? <ScoreMockup /> : null}
      {variant === "rewrite" ? <RewriteMockup /> : null}
      {variant === "export" ? <ExportMockup /> : null}
      {variant === "kanban" ? <KanbanMiniMockup /> : null}
    </div>
  );
}

const BOARD_NAV = ["Workspace", "Resumes", "Analyses", "Applications"] as const;

const BOARD_COLUMNS = [
  {
    title: "Saved",
    dot: "bg-[#8a9385]",
    cards: [
      { company: "Acme", role: "Backend Developer", meta: "Jul 9, 2026" },
      { company: "Northwind", role: "Frontend Engineer", meta: "Jul 7, 2026" },
    ],
  },
  {
    title: "Applied",
    dot: "bg-[#2f80b8]",
    cards: [
      { company: "Globex", role: "Laravel Developer", meta: "Sarah Kim" },
      { company: "Umbrella", role: "SaaS API Engineer", meta: "Jul 2, 2026" },
    ],
  },
  {
    title: "Interview",
    dot: "bg-[#c69220]",
    cards: [{ company: "Initech", role: "Platform Developer", meta: "Jun 28, 2026" }],
  },
  {
    title: "Offer",
    dot: "bg-[#4a8f16]",
    cards: [{ company: "Hooli", role: "Product Engineer", meta: "James Reed" }],
  },
  {
    title: "Rejected",
    dot: "bg-[#b3402f]",
    cards: [{ company: "Stark", role: "Senior PHP Engineer", meta: "Jun 20, 2026" }],
  },
] as const;

export function FullProductMockup() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#fbfaf4] shadow-[0_34px_100px_rgba(0,0,0,0.26)]">
      <div className="flex flex-col gap-4 border-b border-[#e8e4d8] bg-[#fbfaf4] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#154b38] bg-[#062b1f] text-xs font-semibold text-[#a6f20f]">
            A
          </span>
          <p className="text-sm font-semibold text-[#062b1f]">ApplyAI</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BOARD_NAV.map((item) => (
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                item === "Applications"
                  ? "bg-[#062b1f] text-[#f7f5ec]"
                  : "text-[#405047]"
              }`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {BOARD_COLUMNS.map((column) => (
            <section
              className="min-h-[220px] rounded-[24px] border border-[#e6e2d6] bg-[#f6f4ec] p-3"
              key={column.title}
            >
              <div className="flex items-center justify-between px-1 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                  <h3 className="text-sm font-semibold text-[#062b1f]">
                    {column.title}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#657167]">
                  {column.cards.length}
                </span>
              </div>
              <div className="mt-1 grid gap-2.5">
                {column.cards.map((card) => (
                  <div
                    className="rounded-2xl border border-[#e1ded1] bg-white p-3.5 shadow-sm"
                    key={card.role}
                  >
                    <p className="truncate text-sm font-semibold text-[#062b1f]">
                      {card.company}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#657167]">
                      {card.role}
                    </p>
                    <div className="mt-2.5">
                      <span className="rounded-full bg-[#f4f2ea] px-2 py-0.5 text-[11px] font-medium text-[#657167]">
                        {card.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
