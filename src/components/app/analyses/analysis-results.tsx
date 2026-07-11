"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { AnalysisResult } from "@/lib/api";
import {
  AlertIcon,
  ArrowIcon,
  CheckIcon,
  CopyIcon,
  ScoreBar,
  ScoreRing,
  motionEase,
  scoreBand,
  severityMeta,
  useCopy,
} from "./analysis-shared";

function Section({
  children,
  className = "",
  delay = 0,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.section
      className={`rounded-[28px] border border-[#e1ded1] bg-white p-6 shadow-sm sm:p-7 ${className}`}
      {...(reduceMotion
        ? {}
        : {
            animate: { opacity: 1, y: 0 },
            initial: { opacity: 0, y: 14 },
            transition: { duration: 0.45, delay, ease: motionEase },
            viewport: { once: true, margin: "-40px" },
            whileInView: { opacity: 1, y: 0 },
          })}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-[#062b1f]">{children}</h2>;
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const { copied, copy } = useCopy();

  return (
    <button
      aria-label={label}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-4 text-xs font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
      onClick={() => void copy(text)}
      type="button"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function KeywordPills({
  items,
  tone,
}: {
  items: string[];
  tone: "matched" | "missing";
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-[#87917f]">None identified.</p>;
  }

  const className =
    tone === "matched"
      ? "border-[#d9e9c5] bg-[#f2ffd4] text-[#315000]"
      : "border-[#e6cfc9] bg-[#fdf1ee] text-[#8b281f]";

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((keyword, index) => (
        <li
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
          key={`${keyword}-${index}`}
        >
          {keyword}
        </li>
      ))}
    </ul>
  );
}

function PointList({
  items,
  tone,
}: {
  items: string[];
  tone: "strength" | "weakness";
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-[#87917f]">None identified.</p>;
  }

  const iconWrap =
    tone === "strength"
      ? "bg-[#eef4df] text-[#315000]"
      : "bg-[#fbf3da] text-[#7a5a12]";

  return (
    <ul className="mt-4 grid gap-3">
      {items.map((item, index) => (
        <li className="flex gap-3" key={`${tone}-${index}`}>
          <span
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${iconWrap}`}
          >
            {tone === "strength" ? <CheckIcon /> : <AlertIcon />}
          </span>
          <span className="text-sm leading-6 text-[#3a463f]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const INITIAL_BULLETS = 4;

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;
  const band = scoreBand(result.overall_score);
  const [showAllBullets, setShowAllBullets] = useState(false);

  const visibleBullets = showAllBullets
    ? result.rewritten_bullets
    : result.rewritten_bullets.slice(0, INITIAL_BULLETS);
  const hiddenBulletCount = result.rewritten_bullets.length - INITIAL_BULLETS;

  return (
    <div className="mt-6 grid gap-5">
      <Section reduceMotion={reduceMotion}>
        <SectionTitle>Match score</SectionTitle>
        <div className="mt-5 flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing reduceMotion={reduceMotion} value={result.overall_score} />
            <div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${band.chip}`}
              >
                {band.label}
              </span>
              <p className="mt-2 text-sm text-[#657167]">
                Overall fit of your resume against this role.
              </p>
            </div>
          </div>
          <div className="grid flex-1 gap-4 sm:max-w-md">
            <ScoreBar
              label="Keywords"
              reduceMotion={reduceMotion}
              value={result.keyword_score}
            />
            <ScoreBar
              label="Experience"
              reduceMotion={reduceMotion}
              value={result.experience_score}
            />
            <ScoreBar
              label="Skills"
              reduceMotion={reduceMotion}
              value={result.skills_score}
            />
          </div>
        </div>
      </Section>

      <Section delay={0.05} reduceMotion={reduceMotion}>
        <SectionTitle>Keywords</SectionTitle>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#315000]">
              Matched ({result.matched_keywords.length})
            </p>
            <KeywordPills items={result.matched_keywords} tone="matched" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#8b281f]">
              Missing ({result.missing_keywords.length})
            </p>
            <KeywordPills items={result.missing_keywords} tone="missing" />
          </div>
        </div>
      </Section>

      <Section delay={0.05} reduceMotion={reduceMotion}>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <SectionTitle>Strengths</SectionTitle>
            <PointList items={result.strengths} tone="strength" />
          </div>
          <div>
            <SectionTitle>Weaknesses</SectionTitle>
            <PointList items={result.weaknesses} tone="weakness" />
          </div>
        </div>
      </Section>

      {result.gap_analysis.length > 0 ? (
        <Section delay={0.05} reduceMotion={reduceMotion}>
          <SectionTitle>Gap analysis</SectionTitle>
          <ul className="mt-4 grid gap-3">
            {result.gap_analysis.map((gap, index) => {
              const meta = severityMeta[gap.severity] ?? severityMeta.important;

              return (
                <li
                  className="rounded-2xl border border-[#e8e4d8] bg-[#fbfaf4] p-4"
                  key={`${gap.skill}-${index}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#062b1f]">
                      {gap.skill}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-[#3a463f]">
                    {gap.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {result.rewritten_bullets.length > 0 ? (
        <Section delay={0.05} reduceMotion={reduceMotion}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>Rewritten bullet points</SectionTitle>
            <span className="text-xs font-medium text-[#87917f]">
              {result.rewritten_bullets.length} suggestions
            </span>
          </div>
          <p className="mt-1 text-sm text-[#657167]">
            Improved phrasing based only on what your resume already contains.
          </p>
          <ul className="mt-4 grid gap-4">
            {visibleBullets.map((bullet, index) => (
              <li
                className="overflow-hidden rounded-2xl border border-[#e8e4d8]"
                key={`bullet-${index}`}
              >
                <div className="bg-[#fbfaf4] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#87917f]">
                    Original
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#657167]">
                    {bullet.original}
                  </p>
                </div>
                <div className="border-t border-[#e8e4d8] border-l-4 border-l-[#a6f20f] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#315000]">
                        <ArrowIcon /> Rewritten
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#20332a]">
                        {bullet.rewritten}
                      </p>
                    </div>
                    <CopyButton
                      label="Copy rewritten bullet"
                      text={bullet.rewritten}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {hiddenBulletCount > 0 ? (
            <div className="mt-4 flex justify-center">
              <button
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#d8d5c8] bg-[#fbfaf4] px-5 text-sm font-semibold text-[#062b1f] shadow-sm transition hover:border-[#b7b29f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                onClick={() => setShowAllBullets((current) => !current)}
                type="button"
              >
                {showAllBullets
                  ? "Show fewer"
                  : `Show all ${result.rewritten_bullets.length}`}
              </button>
            </div>
          ) : null}
        </Section>
      ) : null}

      {result.cover_letter.trim() ? (
        <Section delay={0.05} reduceMotion={reduceMotion}>
          <div className="flex items-center justify-between gap-3">
            <SectionTitle>Cover letter</SectionTitle>
            <CopyButton label="Copy cover letter" text={result.cover_letter} />
          </div>
          <div className="mt-4 rounded-2xl border border-[#e8e4d8] bg-[#fbfaf4] p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#20332a]">
              {result.cover_letter}
            </p>
          </div>
        </Section>
      ) : null}

      {result.model_used ? (
        <p className="text-center text-xs text-[#a3a08f]">
          Generated by {result.model_used}
        </p>
      ) : null}
    </div>
  );
}
