import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/habits")({ component: Habits });

function Habits() {
  return (
    <AppShell>
      <KindPage
        kind="task"
        defaultCadence="habit"
        entryFilter={(entry) => entry.cadence === "habit"}
        addLabel="New habit"
        title="Habits"
        kicker="Kept"
        blurb="Repeating habits you keep each week — either of you can write them."
        emptyTitle="No habits yet"
        emptyBody="Set the first habit to keep."
      />
    </AppShell>
  );
}
