"use client";

import { SessionProvider } from "next-auth/react";
import { PwaProvider } from "./Pwa";
import DesktopModeHint from "./DesktopModeHint";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <PwaProvider>
        <DesktopModeHint />
        {children}
      </PwaProvider>
    </SessionProvider>
  );
}
