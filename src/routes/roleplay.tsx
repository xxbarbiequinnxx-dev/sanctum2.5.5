import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/roleplay")({ component: Roleplay });

function Roleplay() {
  return (
    <AppShell>
      <KindPage
        kind="roleplay"
        wheel={{ title: "Roleplay wheel", copy: "Spin a prompt, character, script, or setting." }}
      />
    </AppShell>
  );
}
