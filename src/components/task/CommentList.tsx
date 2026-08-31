"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDeleteCommentMutation } from "@/lib/api/tasksApi";
import { formatRelative } from "@/lib/time";
import type { Comment } from "@/types/api";

interface CommentListProps {
  taskId: string;
  comments: Comment[];
}

export function CommentList({ taskId, comments }: CommentListProps) {
  const reduce = useReducedMotion();
  const [deleteComment, { isLoading }] = useDeleteCommentMutation();

  if (comments.length === 0) {
    return <p className="text-xs text-faint">Пока ничего не записано</p>;
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {comments.map((comment) => (
          <motion.li
            key={comment.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="group rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {comment.body}
              </p>
              <button
                onClick={() => deleteComment({ taskId, commentId: comment.id })}
                disabled={isLoading}
                aria-label="Удалить комментарий"
                className="shrink-0 text-faint opacity-0 transition-opacity duration-[var(--dur-hint)] hover:text-cancelled focus-visible:opacity-100 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <p className="meta mt-1.5">{formatRelative(comment.createdAt)}</p>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}