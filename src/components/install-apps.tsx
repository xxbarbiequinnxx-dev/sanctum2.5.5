import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadMacApps, MAC_APPS, type MacAppKind } from "@/lib/mac-app-zip";

export function InstallApps({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function saveMac(kinds: MacAppKind[], id: string) {
    setBusy(id);
    try {
      await downloadMacApps(window.location.origin, kinds);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the Mac app.");
    } finally {
      setBusy(null);
    }
  }

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <p className="text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">Install</p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy !== null}
          onClick={() => void saveMac(["sanctum", "dominant", "submissive"], "mac")}
        >
          <Download className="size-4" />
          {busy === "mac" ? "Preparing…" : "Download .app files"}
        </Button>
        <Button type="button" variant="outline" className="w-full" asChild>
          <a href="/apps/Sanctum.aab" download>
            <Download className="size-4" />
            Download .aab
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="font-display text-2xl">Mac apps</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download real <span className="text-foreground">.app</span> files. Unzip, drag into Applications, then right-click and Open the first time.
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={busy !== null}
          onClick={() => void saveMac(["sanctum", "dominant", "submissive"], "mac")}
        >
          <Download className="size-4" />
          {busy === "mac" ? "Preparing…" : "Download all three .app files"}
        </Button>
        <div className="grid gap-2 sm:grid-cols-3">
          {MAC_APPS.map((app) => (
            <button
              key={app.kind}
              type="button"
              disabled={busy !== null}
              onClick={() => void saveMac([app.kind], app.kind)}
              className="rounded-lg border border-border bg-secondary/50 p-3 text-left hover:border-primary/50"
            >
              <p className="text-sm font-medium">{app.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{app.copy}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="font-display text-2xl">Android app bundle</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One signed <span className="text-foreground">.aab</span> for Google Play (version 2.5). Package <span className="text-foreground">sanctum.com</span>. All three doors live in this app. First launch asks for your Sanctum web address.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href="/apps/Sanctum.aab" download>
            <Download className="size-4" />
            Download Sanctum.aab
          </a>
        </Button>
      </section>
    </div>
  );
}
