import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const peekPreviewResetLink = createServerFn({ method: "POST" })
  .validator((input) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data }) => {
    const { isWorkspacePreview } = await import("@/lib/env.server");
    if (!isWorkspacePreview()) return { url: null as string | null };
    const { takePreviewResetUrl } = await import("@/lib/auth/email-password");
    return { url: takePreviewResetUrl(data.email) };
  });
