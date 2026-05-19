import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 pb-16 text-zinc-950 sm:pb-0">
      <AppHeader />
      {children}
      <BottomNav />
    </div>
  );
}
