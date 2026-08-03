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

export type TourAction =
  | "resume_uploaded"
  | "analysis_created"
  | "application_created";

export type TourStep = {
  id: string;
  page: string | null;
  pagePrefix?: string;
  selector: string;
  title: string;
  body: string;
  action?: TourAction;
  optionalHint?: string;
  nextLabel?: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "workspace",
    page: "/app",
    selector: "workspace-overview",
    title: "Your Candidate workspace",
    body: "This is your overview of resumes, analyses, and active applications. The guide will now walk through every area of the Candidate app.",
    nextLabel: "Explore",
  },
  {
    id: "upload-resume",
    page: "/app/resumes",
    selector: "resume-upload",
    title: "Upload a resume",
    body: "Choose a PDF and upload it while the guide is open, or continue and come back whenever you're ready.",
    action: "resume_uploaded",
    optionalHint: "Optional: upload a PDF now, or choose Next.",
  },
  {
    id: "create-analysis",
    page: "/app/analyses/new",
    selector: "analysis-form",
    title: "Analyze a real job",
    body: "Select a resume, enter the role, and paste the full job description. You can submit it now or explore this later.",
    action: "analysis_created",
    optionalHint: "Optional: run an analysis now, or choose Next.",
  },
  {
    id: "analysis-results",
    page: "/app/analyses",
    pagePrefix: "/app/analyses/",
    selector: "analyses-overview",
    title: "Review every analysis",
    body: "Open any analysis to see its score, keyword gaps, rewritten bullets, cover letter, and tailored resume. Failed analyses can also be retried here.",
  },
  {
    id: "jobs",
    page: "/app/jobs",
    selector: "jobs-search",
    title: "Find relevant jobs",
    body: "Search by title, company, location, or skill. Refine results by employment type, work mode, experience, application status, and your profile preferences.",
  },
  {
    id: "applications",
    page: "/app/applications",
    selector: "applications-overview",
    title: "Follow your applications",
    body: "Applications submitted through ApplyAI appear here. Hiring teams manage each stage, and status and match updates arrive automatically.",
  },
  {
    id: "profile",
    page: "/app/profile",
    selector: "profile-overview",
    title: "Complete your Candidate profile",
    body: "Keep your professional identity, preferred roles, locations, work modes, availability, and links in one place. Your preferences support better job matching.",
  },
  {
    id: "complete",
    page: "/app",
    selector: "",
    title: "You're ready to use ApplyAI",
    body: "You can return to any area from the main navigation. To replay this guide later, open your avatar menu and choose Guide.",
    nextLabel: "Finish",
  },
];

const COMPLETED_KEY = "applyai.onboarding.v3.completed";

type TourContextValue = {
  back: () => void;
  completeAction: (action: TourAction) => void;
  currentStep: TourStep;
  goTo: (stepId: string) => void;
  isActive: boolean;
  next: () => void;
  start: () => void;
  stepIndex: number;
  steps: TourStep[];
  stop: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStartedRef = useRef(false);

  const currentStep = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];

  const navigateTo = useCallback(
    (index: number) => {
      const destination = TOUR_STEPS[index]?.page;

      if (destination && destination !== pathname) {
        router.push(destination);
      }
    },
    [pathname, router],
  );

  const stop = useCallback(() => {
    setIsActive(false);

    try {
      window.localStorage.setItem(COMPLETED_KEY, "1");
    } catch {
      // Storage can be unavailable in private browsing modes.
    }
  }, []);

  const advance = useCallback(() => {
    const nextIndex = stepIndex + 1;

    if (nextIndex >= TOUR_STEPS.length) {
      stop();
      return;
    }

    setStepIndex(nextIndex);
    navigateTo(nextIndex);
  }, [navigateTo, stepIndex, stop]);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
    navigateTo(0);
  }, [navigateTo]);

  const next = useCallback(() => {
    advance();
  }, [advance]);

  const goTo = useCallback(
    (stepId: string) => {
      if (!isActive) {
        return;
      }

      const nextIndex = TOUR_STEPS.findIndex((step) => step.id === stepId);

      if (nextIndex < 0) {
        return;
      }

      setStepIndex(nextIndex);
      navigateTo(nextIndex);
    },
    [isActive, navigateTo],
  );

  const completeAction = useCallback(
    (action: TourAction) => {
      if (!isActive || currentStep.action !== action) {
        return;
      }

      advance();
    },
    [advance, currentStep.action, isActive],
  );

  const back = useCallback(() => {
    const previousIndex = stepIndex - 1;

    if (previousIndex < 0) {
      return;
    }

    setStepIndex(previousIndex);
    navigateTo(previousIndex);
  }, [navigateTo, stepIndex]);

  useEffect(() => {
    if (
      autoStartedRef.current ||
      status !== "authenticated" ||
      pathname !== "/app"
    ) {
      return;
    }

    let completed = false;

    try {
      completed = window.localStorage.getItem(COMPLETED_KEY) === "1";
    } catch {
      completed = false;
    }

    if (completed) {
      return;
    }

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => start(), 700);

    return () => window.clearTimeout(timer);
  }, [pathname, start, status]);

  const value = useMemo<TourContextValue>(
    () => ({
      back,
      completeAction,
      currentStep,
      goTo,
      isActive,
      next,
      start,
      stepIndex,
      steps: TOUR_STEPS,
      stop,
    }),
    [
      back,
      completeAction,
      currentStep,
      goTo,
      isActive,
      next,
      start,
      stepIndex,
      stop,
    ],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive ? <TourOverlay key={currentStep.id} /> : null}
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
