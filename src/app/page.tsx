"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "loading") return;
    router.replace(status === "authenticated" ? "/tasks" : "/login");
  }, [status, router]);

  return <div className="p-8 text-muted">Загрузка…</div>;
}