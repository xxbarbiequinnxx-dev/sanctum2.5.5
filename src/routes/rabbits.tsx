import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rabbits")({
  beforeLoad: () => {
    throw redirect({ to: "/training" });
  },
});
