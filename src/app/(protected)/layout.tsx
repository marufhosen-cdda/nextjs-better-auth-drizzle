import { AuthGuard } from "@/components/auth-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard redirectIfNotAuth="/sign-in">
      <div className="min-h-screen bg-background">{children}</div>
    </AuthGuard>
  );
}
