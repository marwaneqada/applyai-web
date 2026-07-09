"use client";

import { motion, useReducedMotion } from "framer-motion";
import { NAV_ITEMS } from "@/constants/landing";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      className="sticky top-0 z-40 border-b border-[#e8e4d8]/80 bg-[#fbfaf4]/88 backdrop-blur-xl"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="ApplyAI home">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#154b38] bg-[#062b1f] text-sm font-semibold text-[#a6f20f]">
            A
          </span>
          <span className="text-lg font-semibold text-[#062b1f]">ApplyAI</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              className="text-sm font-medium text-[#405047] transition hover:text-[#062b1f]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            className="hidden text-sm font-medium text-[#405047] transition hover:text-[#062b1f] sm:inline-flex"
            href="#product"
          >
            Sign in
          </a>
          <div className="hidden sm:block">
            <Button className="h-10 px-5" href="#final-cta">
              Start tailoring
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
