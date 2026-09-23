import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled } from "@/lib/auth/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

const TOKEN_KEY = "sanctum-reset-token";

function readHeldToken() {
  if (typeof window === "undefined") return "";
  const fromQuery = new URLSearchParams(window.location.search).get("token") ?? "";
  if (fromQuery) {
    try {
      window.sessionStorage.setItem(TOKEN_KEY, fromQuery);
    } catch {
      /* ignore */
    }
    return fromQuery;
  }
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function ResetPassword() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(readHeldToken());
    setError(new URLSearchParams(window.location.search).get("error") ?? "");
    setReady(true);
  }, []);

  const invalid = Boolean(error) || !token;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is missing its key. Ask for a new one.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await authClient.$fetch("/reset-password", {
        method: "POST",
        body: { newPassword: password, token },
      });
      if (resetError) throw new Error(resetError.message ?? "Could not reset the password.");
      try {
        window.sessionStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      setDone(true);
      toast.success("Password updated. Sign in with the new one.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background vignette chamber-grid">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
        <p className="font-display text-2xl tracking-tight">Sanctum</p>
        <h1 className="mt-8 font-display text-4xl">Choose a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">Opening the reset link…</p>
        ) : done ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Your door is locked with the new password. Sign in to continue.
            </p>
            <Button asChild className="mt-6">
              <Link to="/login" search={{ door: undefined }}>Sign in</Link>
            </Button>
          </>
        ) : invalid ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              This reset link is invalid or has expired. Ask for a new one from the sign-in page.
            </p>
            <Button asChild className="mt-6">
              <Link to="/login" search={{ door: undefined }}>Back to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Pick a new password for this door. At least 8 characters.
            </p>
            <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
              <div className="block space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="block space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
                {busy ? "Please wait…" : "Save password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
