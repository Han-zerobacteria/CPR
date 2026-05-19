import Link from "next/link";

const navItems = [
  { href: "/", label: "피드" },
  { href: "/upload", label: "업로드" },
  { href: "/saved", label: "저장" },
  { href: "/mypage", label: "마이" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white sm:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-center text-sm font-medium text-zinc-600"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
