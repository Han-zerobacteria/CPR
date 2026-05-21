import { PublicOnlyShell } from "@/components/layout/PublicOnlyShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <PublicOnlyShell>
      <LoginForm />
    </PublicOnlyShell>
  );
}
