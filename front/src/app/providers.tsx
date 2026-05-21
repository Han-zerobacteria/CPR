"use client";

import { AuthBootstrap } from "@/features/auth/components/AuthBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthBootstrap>{children}</AuthBootstrap>;
}
