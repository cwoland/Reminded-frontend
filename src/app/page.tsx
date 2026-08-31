"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (status === "loading") return;
    router.replace(status === "authenticated" ? "/tasks" : "/login");
  }, [status, router]);

  return <div className="p-8 text-slate-500">Загрузка...</div>;
}