"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="p-8 text-muted">Загрузка...</div>;
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}