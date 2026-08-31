"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HoloFrame } from "./HoloFrame";

interface HoloModalProps {
  open: boolean;
  label?: string;
  meta?: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}

export function HoloModal({ open, label, meta, width = 560, onClose, children }: HoloModalProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="holo-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-bg/60 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label ?? "Окно"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ width, maxWidth: "100%" }}
            className="relative max-h-[82vh]"
          >
            <HoloFrame label={label} meta={meta} onClose={onClose} className="max-h-[82vh]">
              {children}
            </HoloFrame>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}