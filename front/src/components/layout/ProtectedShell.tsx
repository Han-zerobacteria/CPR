"use client";

import Link from "next/link";

import { useAuthStore } from "@/stores/auth-store";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950">로그인이 필요합니다</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          업로드, 저장 목록, 마이페이지는 로그인 후 사용할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
        >
          로그인으로 이동
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}
