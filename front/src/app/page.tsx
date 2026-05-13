import { AppShell } from "@/components/layout/AppShell";
import { HomeFeed } from "@/features/feed/HomeFeed";

export default function HomePage() {
  return (
    <AppShell>
      <HomeFeed />
    </AppShell>
  );
}
