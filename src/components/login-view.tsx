import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rememberRole } from "@/components/onboarding";
import { InstallApps } from "@/components/install-apps";
import { BrandMark } from "@/components/brand-mark";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import type { Role } from "@/lib/kinds";
import { peekPreviewResetLink } from "@/lib/reset-mail";

type Mode = "signin" | "signup" | "forgot" | "forgot-sent";

function keepPreviewSession(data: unknown) {
  if (!data || typeof data !== "object") return;
  const rec = data as Record<string, unknown>;
  const nested =
    rec.session && typeof rec.session === "object"
      ? (rec.session as Record<string, unknown>).token
      : null;
  const token = typeof rec.token === "string" ? rec.token : typeof nested === "string" ? nested : null;
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem("grok-auth.bearer-token", token);
  } catch {
    /* ignore */
  }
}

export function LoginView() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { door?: string };
  const fromUrl = search.door === "dominant" || search.door === "submissive" ? search.door : null;
  const [door, setDoor] = useState<Role | null>(fromUrl);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!authEnabled) return;
    if (mode === "forgot" || mode === "forgot-sent") {
      await sendReset();
      return;
    }
    if (!door) {
      toast.error("Choose Dominant or Submissive first.");
      return;
    }
    rememberRole(door);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || (door === "dominant" ? "Dominant" : "Submissive"),
        });
        if (error) throw new Error(error.message ?? "Could not create the account.");
        keepPreviewSession(data);
      } else {
        const { data, error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message ?? "Could not sign in.");
        keepPreviewSession(data);
      }
      try {
        await authClient.getSession();
      } catch {
        /* bearer is attached; Home will pick the user up */
      }
      await navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!authEnabled) return;
    const address = email.trim();
    if (!address) {
      toast.error("Enter the email on your door first.");
      return;
    }
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: { email: address, redirectTo },
      });
      if (error) throw new Error(error.message ?? "Could not send the reset email.");
      let previewUrl: string | null = null;
      for (let attempt = 0; attempt < 5 && !previewUrl; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 200));
        try {
          const peeked = await peekPreviewResetLink({ data: { email: address } });
          previewUrl = peeked.url;
        } catch {
          previewUrl = null;
        }
      }
      setPreviewResetUrl(previewUrl);
      setMode("forgot-sent");
      toast.success("If that email has a door, a reset link is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setBusy(false);
    }
  }

  function openForgot() {
    setMode("forgot");
    setPreviewResetUrl(null);
  }

  const forgotOpen = mode === "forgot" || mode === "forgot-sent";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background vignette chamber-grid">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-10">
        <div className="flex items-center gap-4">
          <BrandMark className="size-16" />
          <div>
            <p className="font-display text-3xl tracking-tight">Sanctum</p>
            <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
              A private space for one Dominant and one Submissive. Separate doors. One bond.
            </p>
          </div>
        </div>

        {!door && !forgotOpen ? (
          <div className="my-auto py-8">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setDoor("dominant")}
                className="min-h-44 rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 md:min-h-56"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Enter as</p>
                <h1 className="mt-3 font-display text-5xl">Dominant</h1>
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                  Assign the day, write the protocol, hold the key.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setDoor("submissive")}
                className="min-h-44 rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 md:min-h-56"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Enter as</p>
                <h1 className="mt-3 font-display text-5xl">Submissive</h1>
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                  Receive the day, keep the journal, offer the work.
                </p>
              </button>
            </div>
            <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={openForgot}>
                Forgot password
              </Button>
              <InstallApps compact />
            </div>
          </div>
        ) : (
          <div className="my-auto w-full max-w-md py-10">
            <button
              type="button"
              onClick={() => {
                if (forgotOpen) {
                  setMode("signin");
                  setPreviewResetUrl(null);
                  return;
                }
                setDoor(null);
              }}
              className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            {forgotOpen ? (
              <>
                <h1 className="mt-3 font-display text-4xl">Forgot password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "forgot-sent"
                    ? "Check your inbox — and spam — for a Sanctum reset link. It expires in one hour. If you do not see it, try again from this page."
                    : "Enter the email on your door. We will send a link to choose a new password."}
                </p>
                {mode === "forgot-sent" ? (
                  <div className="mt-6 space-y-3">
                    {previewResetUrl ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          This preview cannot send mail, so the reset link is here instead.
                        </p>
                        <Button asChild className="w-full">
                          <a href={previewResetUrl}>Open reset link</a>
                        </Button>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMode("signin");
                        setPreviewResetUrl(null);
                      }}
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
                    <div className="block space-y-1.5">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
                      {busy ? "Please wait…" : "Send reset link"}
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h1 className="mt-3 font-display text-4xl">
                  {door === "dominant" ? "Dominant door" : "Submissive door"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signup" ? "Create your private account." : "Return to Sanctum."}
                </p>
                <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
                  {mode === "signup" ? (
                    <div className="block space-y-1.5">
                      <Label htmlFor="login-name">Name</Label>
                      <Input
                        id="login-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="How you are addressed"
                      />
                    </div>
                  ) : null}
                  <div className="block space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="block space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Password</Label>
                      {mode === "signin" ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={openForgot}
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
                    {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                  </Button>
                </form>
                {mode === "signup" ? (
                  <Button type="button" variant="outline" className="mt-3 w-full" onClick={openForgot}>
                    Forgot password
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="mt-3 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
                >
                  {mode === "signup" ? "Already have a door? Sign in" : "Need a door? Create an account"}
                </button>
                {authEnabled ? (
                  <div className="mt-8 space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Or continue with</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (door) rememberRole(door);
                        void signIn("google", { callbackURL: "/" });
                      }}
                    >
                      Continue with Google
                    </Button>
                    {GROK_PROVIDERS.filter((provider) => provider.idp !== "google").map((provider) => (
                      <Button
                        key={provider.providerId}
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (door) rememberRole(door);
                          void signIn(provider.providerId, { callbackURL: "/" });
                        }}
                      >
                        Continue with {provider.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Sign-in is disabled.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
