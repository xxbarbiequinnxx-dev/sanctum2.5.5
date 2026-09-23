import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/toys")({
  beforeLoad: () => {
    throw redirect({ to: "/catalog" });
  },
});
