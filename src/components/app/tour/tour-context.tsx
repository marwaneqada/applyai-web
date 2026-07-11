"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { TourOverlay } from "./tour-overlay";

export type TourStep = {
  page: string;
  selector: string;
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    page: "/app",
    selector: "",
    title: "Welcome to ApplyAI",
    body: "Here's the quick flow from resume to a tailored PDF. Use Next to follow along — it takes about a minute.",
  },
  {
    page: "/app/resumes",
    selector: "resume-upload",
    title: "1 · Upload your resume",
    body: "Drop a PDF here or browse. We read the text on upload, so it's ready to analyze right away.",
  },
  {
    page: "/app/analyses/new",
    selector: "analysis-form",
    title: "2 · Start an analysis",
    body: "Choose your resume and paste the full job description you're targeting.",
  },
  {
    page: "/app/analyses/new",
    selector: "run-analysis",
    title: "3 · Run it",
    body: "You'll get a match score, matched & missing keywords, rewritten bullets, and a cover letter.",
  },
  {
    page: "/app/analyses",
    selector: "analyses-header",
    title: "4 · Results & PDF",
    body: "Analyses are saved here. Open a completed one and use “Tailored resume” to download a PDF — Harvard, Modern, or Minimal.",
  },
  {
    page: "/app/applications",
    selector: "add-application",
    title: "5 · Track applications",
    body: "Add roles here or straight from an analysis, then drag cards from Saved through to Offer.",
  },
  {
    page: "/app",
    selector: "wk-guide",
    title: "You're all set",
    body: "That's the whole flow. You can reopen this tour anytime from here.",
  },
];

const SEEN_KEY = "applyai.tour.completed";

type TourContextValue = {
  isActive: boolean;
  stepIndex: number;
  steps: TourStep[];
  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStartedRef = useRef(false);

  const navigateTo = useCallback(
    (index: number) => {
      const step = TOUR_STEPS[index];

      if (step && step.page !== pathname) {
        router.push(step.page);
      }
    },
    [pathname, router],
  );

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
    navigateTo(0);
  }, [navigateTo]);

  const stop = useCallback(() => {
    setIsActive(false);

    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
  }, []);

  const next = useCallback(() => {
    const nextIndex = stepIndex + 1;

    if (nextIndex >= TOUR_STEPS.length) {
      stop();
      return;
    }

    setStepIndex(nextIndex);
    navigateTo(nextIndex);
  }, [navigateTo, stepIndex, stop]);

  const back = useCallback(() => {
    const prevIndex = stepIndex - 1;

    if (prevIndex < 0) {
      return;
    }

    setStepIndex(prevIndex);
    navigateTo(prevIndex);
  }, [navigateTo, stepIndex]);

  useEffect(() => {
    if (autoStartedRef.current || status !== "authenticated" || pathname !== "/app") {
      return;
    }

    let seen = false;

    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen) {
      return;
    }

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => start(), 900);

    return () => window.clearTimeout(timer);
  }, [pathname, start, status]);

  const value = useMemo<TourContextValue>(
    () => ({ back, isActive, next, start, stepIndex, steps: TOUR_STEPS, stop }),
    [back, isActive, next, start, stepIndex, stop],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive ? <TourOverlay key={stepIndex} /> : null}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }

  return context;
}
