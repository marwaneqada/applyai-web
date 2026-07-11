"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroProductMockup } from "@/components/landing/product-mockups";

const easeOut = [0.22, 1, 0.36, 1] as const;

const entrance = {
  duration: 0.8,
  ease: easeOut,
} as const;

const copyContainer = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.09,
    },
  },
};

const copyItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.78,
      ease: easeOut,
    },
  },
};

const scoreCardEntrance = {
  hidden: { opacity: 0, scale: 0.96, y: 24 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.36,
      duration: 0.82,
      ease: easeOut,
    },
  },
};

const scoreBars = [
  { color: "#a6f20f", delay: 0.62, width: "w-24" },
  { color: "#19c56b", delay: 0.76, width: "w-20" },
  { color: "#a6f20f", delay: 0.9, width: "w-14" },
];

function MatchScoreCounter({
  className = "",
  delay = 0.42,
}: {
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;
  const score = useMotionValue(reduceMotion ? 91 : 80);
  const displayScore = useTransform(score, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    if (reduceMotion) {
      score.set(91);
      return;
    }

    const controls = animate(score, 91, {
      delay,
      duration: 1.45,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => controls.stop();
  }, [delay, reduceMotion, score]);

  return (
    <motion.span className={`inline-block tabular-nums ${className}`}>
      {displayScore}
    </motion.span>
  );
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion === true;

  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-0 pt-14 sm:px-6 sm:pb-8 sm:pt-16 lg:px-8 lg:pb-10 lg:pt-24"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:gap-16">
        <div className="grid min-w-0 gap-10 lg:grid-cols-[0.94fr_0.5fr] lg:items-end">
          <motion.div
            animate={reduceMotion ? undefined : "show"}
            className="min-w-0 max-w-[350px] sm:max-w-4xl"
            initial={reduceMotion ? false : "hidden"}
            variants={copyContainer}
          >
            <motion.h1
              className="max-w-full text-3xl font-semibold leading-[1.06] text-[#062b1f] sm:text-6xl sm:leading-[1.02] lg:text-7xl"
              variants={copyItem}
            >
              Tailor every resume to the job before you apply.
            </motion.h1>
            <motion.p
              className="mt-6 max-w-3xl text-base leading-7 text-[#405047] sm:text-xl sm:leading-8"
              variants={copyItem}
            >
              Upload your resume, paste a job description, and ApplyAI analyzes the
              match score, finds missing keywords, rewrites stronger bullets,
              drafts a cover letter, and exports a role-ready PDF.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              variants={copyItem}
            >
              <Button className="h-12 px-7" href="/register">
                Start tailoring
              </Button>
              <Button className="h-12 px-7" href="#story" variant="secondary">
                View workflow
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            animate={reduceMotion ? undefined : "show"}
            className="hidden min-w-0 lg:block"
            initial={reduceMotion ? false : "hidden"}
            variants={scoreCardEntrance}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
              className="rounded-[22px] border border-[#e6e2d5] bg-[#f5f3ea] p-5 shadow-[0_18px_60px_rgba(6,43,31,0.08)]"
              transition={{
                delay: 1.55,
                duration: 5.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <p className="text-sm font-semibold text-[#405047]">Match score</p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-6xl font-semibold leading-none text-[#062b1f]">
                    <MatchScoreCounter />
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#405047]">
                    resume match
                  </p>
                </div>
                <div className="grid gap-1.5" aria-hidden="true">
                  {scoreBars.map((bar, index) => (
                    <span
                      className={`relative h-1.5 overflow-hidden rounded-full bg-[#d8d5c8]/50 ${bar.width}`}
                      key={bar.width}
                    >
                      <motion.span
                        animate={reduceMotion ? undefined : { scaleX: 1 }}
                        className="absolute inset-y-0 left-0 w-full origin-left overflow-hidden rounded-full"
                        initial={reduceMotion ? false : { scaleX: 0 }}
                        style={{ backgroundColor: bar.color }}
                        transition={{
                          delay: bar.delay,
                          duration: 0.76,
                          ease: easeOut,
                        }}
                      >
                        <motion.span
                          animate={
                            reduceMotion
                              ? undefined
                              : { x: ["-140%", "145%"], opacity: [0, 0.55, 0] }
                          }
                          className="absolute inset-y-0 left-0 w-8 bg-white/60"
                          transition={{
                            delay: 1.65 + index * 0.24,
                            duration: 2.4,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatDelay: 2.8,
                          }}
                        />
                      </motion.span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="hero-suggestion-live mt-6 rounded-2xl bg-white p-4 text-sm leading-6 text-[#405047]">
                Missing keywords: Docker, CI/CD. Rewritten bullets and PDF export
                stay connected to the target job.
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative min-w-0">
          <motion.div
            animate={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
            className="absolute -right-24 top-10 hidden h-72 w-72 rounded-[48px] bg-[#e9eddf] lg:block"
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0, x: 18, y: 18 }}
            transition={{
              ...entrance,
              delay: 0.42,
            }}
          />
          <motion.div
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            className="relative min-w-0 max-w-[350px] overflow-hidden sm:max-w-full lg:-mx-3"
            initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
            transition={{ ...entrance, delay: 0.46, duration: 0.9 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, 3, 0] }}
              transition={{
                delay: 1.8,
                duration: 6.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <HeroProductMockup score={<MatchScoreCounter delay={0.92} />} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
