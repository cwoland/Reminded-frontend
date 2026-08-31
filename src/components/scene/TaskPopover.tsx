"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HoloFrame } from "@/components/ui/HoloFrame";
import { TaskDetails } from "@/components/task/TaskDetails";

const WIDTH = 340;
const HEIGHT = 430;
const GAP = 22;

interface TaskPopoverProps {
  taskId: string | null;
  anchor: { x: number; y: number } | null;
  sceneWidth: number;
  sceneHeight: number;
  onClose: () => void;
}

export function TaskPopover({ taskId, anchor, sceneWidth, sceneHeight, onClose }: TaskPopoverProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!taskId) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [taskId, onClose]);

  const open = Boolean(taskId && anchor);

  const flipLeft = anchor ? anchor.x > 0 : false;
  const left = anchor ? (flipLeft ? anchor.x - WIDTH - GAP : anchor.x + GAP) : 0;

  const halfW = sceneWidth / 2;
  const halfH = sceneHeight / 2;

  const clampedLeft = Math.min(Math.max(left, -halfW + 8), halfW - WIDTH - 8);
  const clampedTop = anchor
    ? Math.min(Math.max(anchor.y - HEIGHT / 2, -halfH + 8), halfH - HEIGHT - 8)
    : 0;

  const originY = anchor ? Math.min(Math.max(anchor.y - clampedTop, 16), HEIGHT - 16) : HEIGHT / 2;

  return (
    <AnimatePresence>
      {open && anchor && taskId && (
        <motion.div
          key="task-popover"
          role="dialog"
          aria-label="Карточка задачи"
          onPointerDown={(event) => event.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.94)" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)" }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: "absolute",
            left: `calc(50% + ${clampedLeft}px)`,
            top: `calc(50% + ${clampedTop}px)`,
            width: WIDTH,
            maxHeight: HEIGHT,
            transformOrigin: `${flipLeft ? "right" : "left"} ${originY}px`,
            zIndex: 600,
          }}
        >
          <HoloFrame label="задача" onClose={onClose} className="max-h-[430px]">
            <TaskDetails taskId={taskId} onDeleted={onClose} />
          </HoloFrame>
        </motion.div>
      )}
    </AnimatePresence>
  );
}