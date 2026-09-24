import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile-auth-config")({
  server: {
    handlers: {
      GET: () => {
        const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || null;
        return Response.json(
          { googleClientId },
          {
            headers: {
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
