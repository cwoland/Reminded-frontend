"use client";

import { useEffect, useState } from "react";
import { refreshSession } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 2500);

    refreshSession()
      .catch(() => {
        useAuthStore.getState().setAnonymous();
      })
      .finally(() => clearTimeout(timer));

    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <span className="meta">инициализация…</span>

        {slow && (
          <p className="max-w-xs text-center text-xs text-faint">
            Сервер просыпается после простоя — это занимает до минуты. Дальше будет быстро.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}