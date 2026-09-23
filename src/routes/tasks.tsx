import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/tasks")({ component: Tasks });

function Tasks() {
  return (
    <AppShell>
      <KindPage
        kind="task"
        defaultCadence="daily"
        entryFilter={(entry) => entry.cadence !== "habit"}
        blurb="Daily, weekly, custom-day, and one-off assignments — either of you can write them."
        emptyBody="Set the first daily, weekly, or custom assignment."
      />
    </AppShell>
  );
}
