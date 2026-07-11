"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoryProductMockup } from "@/components/landing/product-mockups";
import { Reveal } from "@/components/landing/reveal";
import { STORY_STEPS } from "@/constants/landing";

const transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
} as const;

type StoryStep = (typeof STORY_STEPS)[number];

function StepDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-[#f2f1e8] px-3 py-2"
      aria-hidden="true"
    >
      {STORY_STEPS.map((item, index) => (
        <span
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
            index === activeIndex
              ? "bg-[#062b1f]"
              : index < activeIndex
                ? "bg-[#588100]"
                : "border border-[#c9c5b7] bg-transparent"
          }`}
          key={item.title}
        />
      ))}
    </div>
  );
}

function StoryTextBlock({
  activeStep,
  index,
  setStepRef,
  step,
}: {
  activeStep: number;
  index: number;
  setStepRef: (index: number, node: HTMLElement | null) => void;
  step: StoryStep;
}) {
  const isActive = activeStep === index;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      aria-current={isActive ? "step" : undefined}
      className="flex min-h-[84vh] flex-col justify-center py-16"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      ref={(node) => setStepRef(index, node)}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.2 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      <StepDots activeIndex={index} />
      <div className="mt-10 max-w-md">
        <p
          className={`text-sm font-semibold transition-colors duration-[250ms] ${
            isActive ? "text-[#588100]" : "text-[#a5b09e]"
          }`}
        >
          {String(index + 1).padStart(2, "0")} / {step.eyebrow}
        </p>
        <h3
          className={`mt-5 text-3xl font-semibold leading-[1.12] transition-colors duration-[250ms] ${
            isActive ? "text-[#062b1f]" : "text-[#657167]"
          }`}
        >
          {step.title}
        </h3>
        <p
          className={`mt-5 text-lg leading-8 transition-colors duration-[250ms] ${
            isActive ? "text-[#405047]" : "text-[#657167]"
          }`}
        >
          {step.description}
        </p>
        <div className="mt-7 inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-4 py-2 text-sm font-semibold text-[#315000]">
          {step.metric}
        </div>
        <div className="mt-7 grid gap-3">
          {step.bullets.map((bullet) => (
            <div
              className="flex items-center gap-3 rounded-full border border-[#e6e2d5] bg-white/70 px-4 py-3 text-sm font-semibold text-[#20332a]"
              key={bullet}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#19c56b]" />
              {bullet}
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export function StorytellingSection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const shouldReduceMotion = useReducedMotion();
  const activeStory = STORY_STEPS[activeStep];
  const setStepRef = useCallback((index: number, node: HTMLElement | null) => {
    stepRefs.current[index] = node;
  }, []);

  useEffect(() => {
    let frameId = 0;

    const updateActiveStep = () => {
      frameId = 0;
      const anchor = window.innerHeight * 0.6;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      stepRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const stepCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(stepCenter - anchor);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveStep((current) => (current === closestIndex ? current : closestIndex));
    };

    const requestUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveStep);
    };

    updateActiveStep();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <section id="story" className="relative bg-[#fbfaf4]">
      <Reveal className="mx-auto max-w-[390px] px-5 pb-6 pt-16 text-center sm:max-w-7xl sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-[#588100]">ApplyAI workflow</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[#062b1f] sm:text-4xl">
          From uploaded resume to role-ready application.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#405047] sm:text-lg sm:leading-8">
          A guided workflow from resume upload to tailored PDF and tracked application.
        </p>
      </Reveal>

      <div className="mx-auto hidden max-w-7xl grid-cols-[0.75fr_1.25fr] gap-16 px-8 pb-20 lg:grid">
        <div className="min-w-0">
          {STORY_STEPS.map((step, index) => (
            <StoryTextBlock
              activeStep={activeStep}
              index={index}
              key={step.title}
              setStepRef={setStepRef}
              step={step}
            />
          ))}
        </div>

        <div className="min-w-0">
          <div className="sticky top-24 grid h-[calc(100vh-120px)] min-h-[560px] place-items-center py-8">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full"
                exit={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, scale: 0.985, y: -10 }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, scale: 0.985, y: 12 }
                }
                key={activeStory.mockup}
                transition={shouldReduceMotion ? { duration: 0 } : transition}
              >
                <StoryProductMockup variant={activeStory.mockup} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 pb-20 sm:px-6 lg:hidden">
        {STORY_STEPS.map((item, index) => (
          <motion.article
            className="mx-auto w-full max-w-3xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            key={item.title}
            transition={transition}
            viewport={{ once: true, amount: 0.24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          >
            <div className="mb-5 rounded-[28px] border border-[#e1ded1] bg-white p-6">
              <p className="text-sm font-semibold text-[#588100]">
                {String(index + 1).padStart(2, "0")} / {item.eyebrow}
              </p>
              <h3 className="mt-4 text-3xl font-semibold leading-tight text-[#062b1f]">
                {item.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#405047]">
                {item.description}
              </p>
              <div className="mt-5 inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-4 py-2 text-sm font-semibold text-[#315000]">
                {item.metric}
              </div>
              <div className="mt-5 grid gap-2">
                {item.bullets.map((bullet) => (
                  <div
                    className="flex items-center gap-3 rounded-full border border-[#e6e2d5] bg-[#fbfaf4] px-4 py-3 text-sm font-semibold text-[#20332a]"
                    key={bullet}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#19c56b]" />
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
            <StoryProductMockup variant={item.mockup} />
          </motion.article>
        ))}
      </div>
    </section>
  );
}
