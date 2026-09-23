import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoginView } from "@/components/login-view";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    door: search.door === "dominant" || search.door === "submissive" ? search.door : undefined,
  }),
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (user && !isPending) return <Navigate to="/" />;
  return <LoginView />;
}
