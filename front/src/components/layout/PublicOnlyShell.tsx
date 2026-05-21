"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";

export function PublicOnlyShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  if (status === "idle" || status === "checking" || status === "authenticated") {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950">인증 상태를 확인하고 있습니다</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          잠시만 기다려주세요.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
