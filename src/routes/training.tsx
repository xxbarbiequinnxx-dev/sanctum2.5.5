import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/training")({ component: Training });

function Training() {
  return (
    <AppShell>
      <KindPage kind="rabbit" />
    </AppShell>
  );
}
