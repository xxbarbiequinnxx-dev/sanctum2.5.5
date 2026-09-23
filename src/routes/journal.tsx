import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { JournalView } from "@/components/journal-view";

export const Route = createFileRoute("/journal")({ component: Journal });

function Journal() {
  return (
    <AppShell>
      <JournalView />
    </AppShell>
  );
}
