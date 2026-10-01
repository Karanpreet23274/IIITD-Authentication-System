"use client";

import { SessionProvider } from "next-auth/react";
import { PwaProvider } from "./Pwa";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <PwaProvider>{children}</PwaProvider>
    </SessionProvider>
  );
}
