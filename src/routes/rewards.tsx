import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/rewards")({ component: Rewards });

function Rewards() {
  return (
    <AppShell>
      <KindPage
        kind="reward"
        wheel={{ title: "Reward wheel", copy: "Spin the posted rewards." }}
      />
    </AppShell>
  );
}
