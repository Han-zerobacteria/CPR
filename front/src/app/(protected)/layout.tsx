import { AppShell } from "@/components/layout/AppShell";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <ProtectedShell>{children}</ProtectedShell>
    </AppShell>
  );
}
