"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { METRICS } from "@/constants/landing";
import { Reveal, RevealItem, StaggerReveal } from "@/components/landing/reveal";

function AnimatedNumber({
  value,
  suffix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const count = useMotionValue(value);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const display = useTransform(count, (latest) => {
    const formatted =
      decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString();
    return `${formatted}${suffix}`;
  });

  useEffect(() => {
    if (!isInView) {
      hasAnimatedRef.current = false;
      count.set(value * 0.86);
      return;
    }

    if (hasAnimatedRef.current) {
      return;
    }

    hasAnimatedRef.current = true;

    if (shouldReduceMotion) {
      count.set(value);
      return;
    }

    count.set(value * 0.86);
    const controls = animate(count, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    });

    return controls.stop;
  }, [count, isInView, shouldReduceMotion, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function ResultsSection() {
  const markers = ["bg-[#19c56b]", "bg-[#d33fd8]", "bg-[#f0522c]"];

  return (
    <section id="results" className="bg-[#fbfaf4] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-4xl">
          <p className="text-sm font-semibold text-[#588100]">What you get</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#062b1f] sm:text-5xl lg:text-6xl">
            Everything each analysis gives you.
          </h2>
        </Reveal>

        <StaggerReveal className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-0" delay={0.1}>
          {METRICS.map((metric, index) => (
            <RevealItem key={metric.label}>
              <div className="relative border-l border-[#d8d5c8] py-2 pl-8 lg:pr-12">
                <span
                  className={`absolute -left-[5px] top-0 h-2.5 w-2.5 ${markers[index]}`}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:flex-col lg:items-start">
                  <p className="text-7xl font-semibold leading-none text-[#062b1f]">
                    <AnimatedNumber
                      decimals={metric.decimals}
                      suffix={metric.suffix}
                      value={metric.value}
                    />
                  </p>
                  <div>
                    <p className="max-w-[220px] text-2xl leading-8 text-[#405047]">
                      {metric.label}
                    </p>
                    <p className="mt-3 max-w-[260px] text-sm leading-6 text-[#657167]">
                      {metric.detail}
                    </p>
                  </div>
                </div>
              </div>
            </RevealItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
