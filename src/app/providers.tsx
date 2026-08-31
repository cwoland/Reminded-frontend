"use client";

import { Provider } from "react-redux";
import { store } from "@/store/redux";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ServiceWorkerRegister />
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}