import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/scenes")({ component: Scenes });

function Scenes() {
  return (
    <AppShell>
      <KindPage
        kind="scene"
        wheel={{ title: "Scene wheel", copy: "Spin the planned scenes." }}
      />
    </AppShell>
  );
}
