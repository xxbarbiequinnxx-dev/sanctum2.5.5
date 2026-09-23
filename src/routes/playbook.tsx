import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/playbook")({ component: Playbook });

function Playbook() {
  return (
    <AppShell>
      <KindPage kind="playbook" />
    </AppShell>
  );
}
