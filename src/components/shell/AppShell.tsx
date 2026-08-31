import type { ReactNode } from "react";
import { Backdrop } from "./Backdrop";

interface AppShellProps {
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, meta, actions, children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh">
      <Backdrop />

      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between gap-4 border-b border-line py-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-semibold tracking-tight text-text">
              REMINDED
            </span>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <h1 className="text-sm text-muted">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {meta && <span className="meta hidden sm:inline">{meta}</span>}
            {actions}
          </div>
        </header>

        <main className="flex-1 py-8">{children}</main>

        <footer className="border-t border-line py-4">
          <span className="meta">reminded · go + mongo · v0.1</span>
        </footer>
      </div>
    </div>
  );
}