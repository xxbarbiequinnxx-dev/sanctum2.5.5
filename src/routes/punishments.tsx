import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/punishments")({ component: Punishments });

function Punishments() {
  return (
    <AppShell>
      <KindPage
        kind="punishment"
        wheel={{ title: "Punishment wheel", copy: "Spin the posted corrections." }}
      />
    </AppShell>
  );
}
