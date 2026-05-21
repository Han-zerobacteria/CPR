import { PublicOnlyShell } from "@/components/layout/PublicOnlyShell";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <PublicOnlyShell>
      <SignupForm />
    </PublicOnlyShell>
  );
}
