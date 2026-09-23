import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HomeView } from "@/components/home-view";
import { LoginView } from "@/components/login-view";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { sessionUser } = Route.useRouteContext() as {
    sessionUser?: { id: string; email: string } | null;
  };
  const { user } = useCurrentUserState();
  if (user || sessionUser) {
    return (
      <AppShell>
        <HomeView />
      </AppShell>
    );
  }
  return <LoginView />;
}
