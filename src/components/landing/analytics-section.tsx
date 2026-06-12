"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { type ReactNode, useRef } from "react";

const revealTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
} as const;

function RevealCard({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985, y: 22 }}
      transition={{ ...revealTransition, delay }}
      viewport={{ once: false, amount: 0.35 }}
      whileInView={
        shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }
      }
    >
      {children}
    </motion.div>
  );
}

function ScoreDots({ active = 5 }: { active?: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          className={`h-2 w-2 rounded-full ${
            index < active ? "bg-[#a6f20f]" : "border border-[#7aa453]"
          }`}
          key={index}
        />
      ))}
    </div>
  );
}

function PerformanceCard() {
  return (
    <div className="rounded-[18px] border border-[#135735] bg-[#062816] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6ffd6] text-sm font-semibold text-[#062b1f]">
            PDF
          </span>
          <div>
            <p className="text-xs text-[#a8b9a6]">Resume</p>
            <p className="text-sm font-semibold text-white">marwane-resume.pdf</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#a8b9a6]">Match score</p>
          <div className="mt-1 flex items-center gap-3">
            <ScoreDots active={5} />
            <p className="text-3xl font-semibold leading-none text-white">91%</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[14px] border border-[#154c31] bg-[#031f14] p-4">
        <p className="text-sm font-semibold text-white">Analysis scores</p>
        <div className="mt-6 flex h-24 items-end gap-12 border-b border-[#154c31] px-8">
          <div className="grid gap-2 text-center">
            <span className="grid h-16 w-16 place-items-start rounded-t-xl bg-[#d9ff94] px-2 py-2 text-sm font-semibold text-[#062b1f]">
              90%
            </span>
            <span className="text-xs text-[#a8b9a6]">Keywords</span>
          </div>
          <div className="grid gap-2 text-center">
            <span className="grid h-[5.5rem] w-16 place-items-start rounded-t-xl bg-[#19c56b] px-2 py-2 text-sm font-semibold text-[#062b1f]">
              93%
            </span>
            <span className="text-xs text-[#a8b9a6]">Skills</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceCard() {
  return (
    <div className="space-y-3">
      {[
        ["Matched keywords", "28", 5],
        ["Missing keywords", "2", 4],
      ].map(([label, value, active]) => (
        <div
          className="flex items-center justify-between gap-5 rounded-full border border-[#135735] bg-[#062816] px-5 py-3 text-sm font-semibold text-white"
          key={label}
        >
          <span>{label}</span>
          <span className="flex items-center gap-3">
            {value}
            <ScoreDots active={Number(active)} />
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#135735] bg-[#062816] p-5">
      <p className="text-3xl font-semibold leading-none text-white">{value}</p>
      <p className="mt-3 text-sm font-semibold text-[#a8b9a6]">{label}</p>
    </div>
  );
}

function LengthCard() {
  return (
    <div className="rounded-[12px] border border-[#135735] bg-[#062816] p-5">
      <p className="text-lg font-semibold text-white">Application stages</p>
      <div className="mt-8 space-y-4">
        {[
          ["Saved", "4", "w-[42%]", "bg-[#a6f20f]"],
          ["Applied", "3", "w-[34%]", "bg-[#19c56b]"],
          ["Interview", "1", "w-[16%]", "bg-[#d33fd8]"],
        ].map(([label, value, width, color]) => (
          <div className="grid gap-2" key={label}>
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-1 rounded-full bg-[#18492f]">
              <div className={`h-1 rounded-full ${width} ${color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationBoardCard() {
  return (
    <div className="rounded-[12px] border border-[#135735] bg-[#062816] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[#d6ffd6] text-xs font-semibold text-[#062b1f]">
            KB
          </span>
          <p className="text-sm font-semibold text-white">Application board</p>
        </div>
        <span className="text-[#6b8b68]">...</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6">
        {[
          ["12", "Tracked"],
          ["8", "Active"],
          ["3", "PDFs"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-[#a8b9a6]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const floatUp = useTransform(scrollYProgress, [0, 1], [38, -28]);
  const floatDown = useTransform(scrollYProgress, [0, 1], [-18, 30]);
  const floatSoft = useTransform(scrollYProgress, [0, 1], [18, -16]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [14, -10]);

  return (
    <section
      className="relative overflow-hidden bg-[#031f14] px-5 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative min-h-[680px] xl:min-h-[720px]">
          <motion.div
            className="mx-auto flex min-h-[300px] max-w-4xl flex-col items-center justify-center text-center xl:absolute xl:left-1/2 xl:top-1/2 xl:min-h-0 xl:-translate-x-1/2 xl:-translate-y-1/2"
            style={shouldReduceMotion ? undefined : { y: headlineY }}
          >
            <p className="text-sm font-semibold text-[#a6f20f]">Match analysis</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Every resume match, gap, export, and application in view.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c7d4c1]">
              ApplyAI turns each job description into scores, keyword gaps, rewrite
              suggestions, PDF exports, and trackable application cards.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:hidden">
            <RevealCard>
              <PerformanceCard />
            </RevealCard>
            <RevealCard delay={0.06}>
              <ComplianceCard />
            </RevealCard>
            <div className="grid gap-4 sm:grid-cols-2">
              <RevealCard delay={0.12}>
                <StatCard label="Resumes analyzed" value="128" />
              </RevealCard>
              <RevealCard delay={0.18}>
                <StatCard label="PDFs generated" value="43" />
              </RevealCard>
            </div>
            <RevealCard delay={0.24}>
              <LengthCard />
            </RevealCard>
            <div className="md:col-span-2">
              <RevealCard delay={0.3}>
                <ApplicationBoardCard />
              </RevealCard>
            </div>
          </div>

          <motion.div
            className="absolute left-[13%] top-[2%] hidden w-[330px] xl:block"
            style={shouldReduceMotion ? undefined : { y: floatUp }}
          >
            <RevealCard>
              <PerformanceCard />
            </RevealCard>
          </motion.div>

          <motion.div
            className="absolute right-[10%] top-[10%] hidden w-[340px] xl:block"
            style={shouldReduceMotion ? undefined : { y: floatDown }}
          >
            <RevealCard delay={0.08}>
              <ComplianceCard />
            </RevealCard>
          </motion.div>

          <motion.div
            className="absolute left-0 top-[47%] hidden w-[260px] space-y-4 xl:block"
            style={shouldReduceMotion ? undefined : { y: floatSoft }}
          >
            <RevealCard delay={0.16}>
              <StatCard label="Resumes analyzed" value="128" />
            </RevealCard>
            <RevealCard delay={0.24}>
              <StatCard label="PDFs generated" value="43" />
            </RevealCard>
          </motion.div>

          <motion.div
            className="absolute right-0 top-[50%] hidden w-[330px] xl:block"
            style={shouldReduceMotion ? undefined : { y: floatUp }}
          >
            <RevealCard delay={0.2}>
              <LengthCard />
            </RevealCard>
          </motion.div>

          <motion.div
            className="absolute bottom-[2%] left-1/2 hidden w-[380px] -translate-x-1/2 xl:block"
            style={shouldReduceMotion ? undefined : { y: floatDown }}
          >
            <RevealCard delay={0.28}>
              <ApplicationBoardCard />
            </RevealCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
