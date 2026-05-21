"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/features/auth/api/session-api";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/", label: "피드" },
  { href: "/upload", label: "업로드" },
  { href: "/saved", label: "저장" },
  { href: "/mypage", label: "마이" },
];

export function AppHeader() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-normal">
          CPR
        </Link>
        <nav aria-label="주요 메뉴" className="hidden items-center gap-5 text-sm sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {status === "idle" || status === "checking" ? (
          <div
            aria-hidden="true"
            className="h-8 w-[4.625rem] rounded-md border border-transparent px-3 py-1.5"
          />
        ) : status === "authenticated" ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-32 truncate text-sm font-medium text-zinc-700 sm:inline">
              {user?.nickname}
            </span>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
