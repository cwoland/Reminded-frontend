"use client";

import { Provider } from "react-redux";
import { store } from "@/store/redux";
import { AuthBootstrap } from "@/components/AuthBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
    <Provider store={store}>
        <AuthBootstrap>
        {children}
        </AuthBootstrap>
    </Provider>
    );
}