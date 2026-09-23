import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/notes")({ component: Notes });

function Notes() {
  return (
    <AppShell>
      <KindPage kind="note" />
    </AppShell>
  );
}
