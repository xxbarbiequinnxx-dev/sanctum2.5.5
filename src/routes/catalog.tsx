import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/catalog")({ component: Catalog });

function Catalog() {
  return (
    <AppShell>
      <KindPage kind="catalog" />
    </AppShell>
  );
}
