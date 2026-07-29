"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTour } from "./tour-context";

const TOOLTIP_WIDTH = 340;
const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 16;

type Viewport = {
  height: number;
  width: number;
};

function BackdropPanel({
  children,
  dimmed = false,
  style,
}: {
  children?: ReactNode;
  dimmed?: boolean;
  style: CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-auto fixed ${dimmed ? "bg-[#062b1f]/55" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

function LoadingStep({
  canGoBack,
  onBack,
  onNext,
  onStop,
  showRecovery,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onStop: () => void;
  showRecovery: boolean;
}) {
  return (
    <div className="pointer-events-auto fixed inset-0 grid place-items-center bg-[#062b1f]/55 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[#e1ded1] bg-white p-5 shadow-[0_24px_70px_rgba(6,43,31,0.28)]">
        <div className="flex items-center gap-3">
          <span
            className={`h-4 w-4 shrink-0 rounded-full border-2 border-[#d9e9c5] border-t-[#588100] ${
              showRecovery ? "" : "animate-spin"
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-[#20332a]">
              {showRecovery
                ? "This guide step isn't available yet."
                : "Opening the next step..."}
            </p>
            {showRecovery ? (
              <p className="mt-1 text-xs leading-5 text-[#657167]">
                You can continue the guide or close it and use the page normally.
              </p>
            ) : null}
          </div>
        </div>

        {showRecovery ? (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              className="h-9 rounded-full px-3 text-sm font-semibold text-[#657167] transition hover:bg-[#eff3df] hover:text-[#062b1f]"
              onClick={onStop}
              type="button"
            >
              Close guide
            </button>
            {canGoBack ? (
              <button
                className="h-9 rounded-full px-3 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df]"
                onClick={onBack}
                type="button"
              >
                Back
              </button>
            ) : null}
            <button
              className="h-9 rounded-full bg-[#062b1f] px-4 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13]"
              onClick={onNext}
              type="button"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TourOverlay() {
  const {
    back,
    currentStep: step,
    next,
    stepIndex,
    steps,
    stop,
  } = useTour();
  const pathname = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ height: 0, width: 0 });

  const routeReady =
    step.page === null ||
    pathname === step.page ||
    Boolean(step.pagePrefix && pathname.startsWith(step.pagePrefix));
  const needsTarget = step.selector !== "";
  const targetReady = !needsTarget || rect !== null;

  useEffect(() => {
    if (routeReady && targetReady) {
      return;
    }

    const timer = window.setTimeout(() => setShowRecovery(true), 4000);

    return () => window.clearTimeout(timer);
  }, [routeReady, step.id, targetReady]);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!routeReady || !needsTarget) {
      return;
    }

    const selector = `[data-tour="${step.selector}"]`;
    let target: HTMLElement | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let settleTimers: number[] = [];

    const measure = () => {
      if (!target || !document.documentElement.contains(target)) {
        target = null;
        setRect(null);
        return;
      }

      const nextRect = target.getBoundingClientRect();

      setRect((current) => {
        if (
          current &&
          Math.abs(current.top - nextRect.top) < 0.5 &&
          Math.abs(current.left - nextRect.left) < 0.5 &&
          Math.abs(current.width - nextRect.width) < 0.5 &&
          Math.abs(current.height - nextRect.height) < 0.5
        ) {
          return current;
        }

        return nextRect;
      });
    };

    const locate = () => {
      const nextTarget = document.querySelector<HTMLElement>(selector);

      if (!nextTarget || nextTarget === target) {
        return;
      }

      resizeObserver?.disconnect();
      target = nextTarget;
      target.scrollIntoView({ behavior: "auto", block: "center" });

      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(target);

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
      settleTimers = [120, 320, 620].map((delay) =>
        window.setTimeout(measure, delay),
      );
    };

    const mutationObserver = new MutationObserver(locate);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const updatePosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    locate();

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [needsTarget, routeReady, step.selector]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stop]);

  if (viewport.width === 0 || !routeReady || !targetReady) {
    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <LoadingStep
          canGoBack={stepIndex > 0}
          onBack={back}
          onNext={next}
          onStop={stop}
          showRecovery={showRecovery}
        />
      </div>,
      document.body,
    );
  }

  const isLast = stepIndex === steps.length - 1;
  const tooltipWidth = Math.min(
    TOOLTIP_WIDTH,
    Math.max(280, viewport.width - 32),
  );

  let tooltipStyle: CSSProperties = {
    left: "50%",
    position: "fixed",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: tooltipWidth,
  };

  let spotlight:
    | {
        bottom: number;
        left: number;
        right: number;
        top: number;
      }
    | undefined;

  if (rect) {
    spotlight = {
      bottom: Math.min(
        viewport.height,
        rect.bottom + SPOTLIGHT_PADDING,
      ),
      left: Math.max(0, rect.left - SPOTLIGHT_PADDING),
      right: Math.min(viewport.width, rect.right + SPOTLIGHT_PADDING),
      top: Math.max(0, rect.top - SPOTLIGHT_PADDING),
    };

    const maxLeft = Math.max(16, viewport.width - tooltipWidth - 16);
    const maxTop = Math.max(16, viewport.height - 250);
    const spaceRight = viewport.width - spotlight.right;
    const spaceLeft = spotlight.left;
    const spaceBelow = viewport.height - spotlight.bottom;

    if (spaceRight >= tooltipWidth + TOOLTIP_GAP) {
      tooltipStyle = {
        left: spotlight.right + TOOLTIP_GAP,
        position: "fixed",
        top: Math.min(Math.max(spotlight.top, 16), maxTop),
        width: tooltipWidth,
      };
    } else if (spaceLeft >= tooltipWidth + TOOLTIP_GAP) {
      tooltipStyle = {
        left: spotlight.left - tooltipWidth - TOOLTIP_GAP,
        position: "fixed",
        top: Math.min(Math.max(spotlight.top, 16), maxTop),
        width: tooltipWidth,
      };
    } else {
      const placeBelow = spaceBelow >= 250;
      tooltipStyle = {
        left: Math.min(Math.max(spotlight.left, 16), maxLeft),
        position: "fixed",
        top: placeBelow
          ? spotlight.bottom + TOOLTIP_GAP
          : Math.max(16, spotlight.top - 250 - TOOLTIP_GAP),
        width: tooltipWidth,
      };
    }
  }

  return createPortal(
    <div
      aria-label="ApplyAI guided setup"
      className="pointer-events-none fixed inset-0 z-[60]"
      role="dialog"
    >
      {spotlight ? (
        <>
          <BackdropPanel
            style={{
              height: spotlight.top,
              left: 0,
              top: 0,
              width: viewport.width,
            }}
          />
          <BackdropPanel
            style={{
              height: viewport.height - spotlight.bottom,
              left: 0,
              top: spotlight.bottom,
              width: viewport.width,
            }}
          />
          <BackdropPanel
            style={{
              height: spotlight.bottom - spotlight.top,
              left: 0,
              top: spotlight.top,
              width: spotlight.left,
            }}
          />
          <BackdropPanel
            style={{
              height: spotlight.bottom - spotlight.top,
              left: spotlight.right,
              top: spotlight.top,
              width: viewport.width - spotlight.right,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed outline outline-2 outline-offset-2 outline-[#a6f20f]"
            style={{
              borderRadius: 28,
              boxShadow: "0 0 0 100vmax rgba(6, 43, 31, 0.55)",
              height: spotlight.bottom - spotlight.top,
              left: spotlight.left,
              top: spotlight.top,
              width: spotlight.right - spotlight.left,
            }}
          />
        </>
      ) : (
        <BackdropPanel
          dimmed
          style={{ height: viewport.height, left: 0, top: 0, width: viewport.width }}
        />
      )}

      <div
        className="pointer-events-auto rounded-2xl border border-[#e1ded1] bg-white p-5 shadow-[0_24px_70px_rgba(6,43,31,0.28)]"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[#87917f]">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <button
            className="text-xs font-semibold text-[#657167] transition hover:text-[#062b1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
            onClick={stop}
            type="button"
          >
            Skip guide
          </button>
        </div>

        <h2 className="mt-2 text-base font-semibold text-[#062b1f]">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-[#657167]">{step.body}</p>

        {step.optionalHint ? (
          <p className="mt-3 text-xs font-medium text-[#526158]">
            {step.optionalHint}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((item, index) => (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  index === stepIndex ? "bg-[#062b1f]" : "bg-[#d8d5c8]"
                }`}
                key={item.id}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && !isLast ? (
              <button
                className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
                onClick={back}
                type="button"
              >
                Back
              </button>
            ) : null}
            <button
              className="inline-flex h-9 items-center rounded-full bg-[#062b1f] px-4 text-sm font-semibold text-[#f7f5ec] transition hover:bg-[#031a13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f]"
              onClick={next}
              type="button"
            >
              {step.nextLabel ?? (isLast ? "Finish" : "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
