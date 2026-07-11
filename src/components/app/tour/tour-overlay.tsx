"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./tour-context";

const TOOLTIP_WIDTH = 320;
const PADDING = 8;
const MAX_FIND_ATTEMPTS = 60;

export function TourOverlay() {
  const { back, next, stepIndex, steps, stop } = useTour();
  const pathname = usePathname();
  const step = steps[stepIndex];

  const [rect, setRect] = useState<DOMRect | null>(null);
  // A step with no selector is a centered card, so it is resolved immediately.
  const [resolved, setResolved] = useState(step ? step.selector === "" : true);

  useEffect(() => {
    if (!step || step.selector === "") {
      return;
    }

    let active = true;
    let timer = 0;
    let attempts = 0;
    const selector = `[data-tour="${step.selector}"]`;

    const find = () => {
      if (!active) {
        return;
      }

      const element = document.querySelector<HTMLElement>(selector);

      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        timer = window.setTimeout(() => {
          if (!active) {
            return;
          }

          setRect(element.getBoundingClientRect());
          setResolved(true);
        }, 320);
        return;
      }

      attempts += 1;

      if (attempts >= MAX_FIND_ATTEMPTS) {
        setResolved(true);
        return;
      }

      timer = window.setTimeout(find, 50);
    };

    find();

    return () => {
      active = false;

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [pathname, step]);

  useEffect(() => {
    if (!rect || !step || step.selector === "") {
      return;
    }

    const selector = `[data-tour="${step.selector}"]`;

    const update = () => {
      const element = document.querySelector<HTMLElement>(selector);

      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [rect, step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  if (!step) {
    return null;
  }

  const isLast = stepIndex === steps.length - 1;

  let tooltipStyle: CSSProperties;

  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeBelow = spaceBelow > 240;
    const top = placeBelow
      ? rect.bottom + PADDING + 12
      : Math.max(16, rect.top - PADDING - 12 - 190);
    const left = Math.min(
      Math.max(rect.left, 16),
      Math.max(16, window.innerWidth - TOOLTIP_WIDTH - 16),
    );
    tooltipStyle = { left, position: "fixed", top, width: TOOLTIP_WIDTH };
  } else {
    tooltipStyle = {
      left: "50%",
      position: "fixed",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: TOOLTIP_WIDTH,
    };
  }

  return createPortal(
    <div aria-modal="true" className="fixed inset-0 z-[60]" role="dialog">
      <div className="absolute inset-0" onClick={(event) => event.stopPropagation()} />

      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl"
          style={{
            boxShadow: "0 0 0 9999px rgba(6,43,31,0.55)",
            height: rect.height + PADDING * 2,
            left: rect.left - PADDING,
            outline: "2px solid #a6f20f",
            outlineOffset: "2px",
            top: rect.top - PADDING,
            width: rect.width + PADDING * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#062b1f]/55" />
      )}

      {resolved ? (
        <div
          className="rounded-2xl border border-[#e1ded1] bg-white p-5 shadow-[0_24px_70px_rgba(6,43,31,0.28)]"
          style={tooltipStyle}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#87917f]">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <button
              className="text-xs font-semibold text-[#657167] transition hover:text-[#062b1f]"
              onClick={stop}
              type="button"
            >
              Skip tour
            </button>
          </div>
          <h3 className="mt-2 text-base font-semibold text-[#062b1f]">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-[#657167]">{step.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1.5" aria-hidden="true">
              {steps.map((item, index) => (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === stepIndex ? "bg-[#062b1f]" : "bg-[#d8d5c8]"
                  }`}
                  key={item.title}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 ? (
                <button
                  className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-[#405047] transition hover:bg-[#eff3df]"
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
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
