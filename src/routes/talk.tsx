import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TalkView } from "@/components/talk-view";

export const Route = createFileRoute("/talk")({ component: Talk });

function Talk() {
  return (
    <AppShell>
      <TalkView />
    </AppShell>
  );
}
