"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const reveal = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1],
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y }}
      transition={{ ...reveal, delay }}
      viewport={{ once: true, amount: 0.22 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delay,
            staggerChildren: 0.08,
          },
        },
      }}
      viewport={{ once: true, amount: 0.08 }}
      whileInView={shouldReduceMotion ? undefined : "visible"}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: reveal,
        },
      }}
    >
      {children}
    </motion.div>
  );
}
