"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation, useRegisterMutation } from "@/lib/api/tasksApi";
import { useAuthStore } from "@/store/auth";

type Mode = "login" | "register";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [mode, setMode] = useState<Mode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [login, { isLoading: isLoggingIn }] = useLoginMutation();
    const [register, { isLoading: isRegistering }] = useRegisterMutation();

    const isLoading = isLoggingIn || isRegistering;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        try {
            const action = mode === "login" ? login : register;
            const result = await action({ username, password }).unwrap();

            setAuth(result.token, result.user);
            router.push("/tasks");
        } catch (err) {
            const apiError = err as { message?: string };
            setError(apiError.message ?? "Не удалось выполнить запрос");
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-slate-900">
                    {mode === "login" ? "Вход" : "Регистрация"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">Reminded</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700">Имя пользователя</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                            minLength={3}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Пароль</label>
                        <input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            required
                            minLength={8}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity:50"
                    >
                        {isLoading ? "Отправляем..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
                    </button>
                </form>

                <button 
                    type="button"
                    onClick={() => {
                        setMode(mode === "login" ? "register" : "login");
                        setError(null);
                    }}
                    className="mt-4 w-full text-sm text-slate-500 hover:text-slate-900"
                >
                    {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Войти"}
                </button>
            </div>
        </main>
    );
}