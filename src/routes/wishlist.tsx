import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KindPage } from "@/components/kind-page";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  return (
    <AppShell>
      <KindPage kind="wishlist" />
    </AppShell>
  );
}
