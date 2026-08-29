"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TOUR_STEPS, stepProgressLabel } from "@/lib/ui/tour";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 10;

function readRect(selector: string): SpotlightRect | null {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

/**
 * Guided demo overlay.
 *
 * Each step moves the app to the screen it describes and outlines the element
 * being discussed. The panel is a modal dialog: focus moves into it, Escape
 * closes it, and the step text is announced on change, so the walkthrough is
 * usable from the keyboard and by a screen reader rather than being a purely
 * visual highlight.
 */
export function GuidedTour({
  stepIndex,
  onNext,
  onPrevious,
  onClose,
}: {
  stepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    return () => returnFocusRef.current?.focus();
  }, []);

  // Measure after the target view has painted, then follow scroll and resize.
  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = window.requestAnimationFrame(() =>
        setRect(readRect(step.target)),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target]);

  useEffect(() => {
    panelRef.current?.focus();
    document.querySelector(step.target)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [step.target]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key === "ArrowRight" && !isLast) onNext();
    if (event.key === "ArrowLeft" && stepIndex > 0) onPrevious();
  }

  return (
    <div className="tour-layer">
      <div className="tour-scrim" aria-hidden="true" />
      {rect && (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            inlineSize: `${rect.width}px`,
            blockSize: `${rect.height}px`,
          }}
        />
      )}
      <div
        ref={panelRef}
        className="tour-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="tour-panel-head">
          <p className="tour-progress">{stepProgressLabel(stepIndex)}</p>
          <button
            type="button"
            className="tour-close"
            onClick={onClose}
            aria-label="End guided demo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-body">{step.body}</p>
        <div
          className="tour-dots"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOUR_STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-label="Guided demo progress"
        >
          {TOUR_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={index <= stepIndex ? "done" : ""}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="tour-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onPrevious}
            disabled={stepIndex === 0}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          <button type="button" className="primary-button" onClick={onNext}>
            {isLast ? "Finish" : "Next"}
            {!isLast && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
