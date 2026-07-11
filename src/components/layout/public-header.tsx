"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { NAV_ITEMS } from "@/constants/landing";
import { AppLogo } from "@/components/brand/app-logo";
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
        <AppLogo href="#top" />

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
          <Link
            className="hidden text-sm font-medium text-[#405047] transition hover:text-[#062b1f] sm:inline-flex"
            href="/login"
          >
            Sign in
          </Link>
          <Button className="h-10 px-5" href="/register">
            Get started
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
