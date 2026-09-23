import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GamesPlay } from "@/components/games-play";

export const Route = createFileRoute("/games")({ component: Games });

function Games() {
  return (
    <AppShell>
      <GamesPlay />
    </AppShell>
  );
}
