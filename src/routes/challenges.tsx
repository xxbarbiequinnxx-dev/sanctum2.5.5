import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChallengesView } from "@/components/challenges-view";

export const Route = createFileRoute("/challenges")({ component: Challenges });

function Challenges() {
  return (
    <AppShell>
      <ChallengesView />
    </AppShell>
  );
}
