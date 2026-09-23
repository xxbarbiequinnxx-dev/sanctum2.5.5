import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HouseView } from "@/components/house-view";

export const Route = createFileRoute("/house")({ component: House });

function House() {
  return (
    <AppShell>
      <HouseView />
    </AppShell>
  );
}
