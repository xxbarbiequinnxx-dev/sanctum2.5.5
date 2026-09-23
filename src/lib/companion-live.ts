import { tickCompanion } from "@/lib/api";
import { emitLive } from "@/lib/live-sync";
import { showAlert } from "@/lib/notify";
import type { CompanionMessage } from "@/lib/types";

const VISIBLE_MS = 22_000;
const HIDDEN_MS = 55_000;
const FIRST_MS = 8_000;

export function startCompanionLive(options: {
  panelOpen: () => boolean;
}) {
  if (typeof window === "undefined") return () => {};
  let stopped = false;
  let timer: number | null = null;
  let inFlight = false;
  let first = true;

  async function tick() {
    if (stopped || inFlight) {
      if (!stopped && !inFlight) schedule();
      return;
    }
    inFlight = true;
    try {
      if (first && options.panelOpen()) {
        return;
      }
      const result = await tickCompanion();
      if (stopped) return;
      const messages = (result?.messages ?? []) as CompanionMessage[];
      if (messages.length) {
        emitLive();
        window.dispatchEvent(new Event("sanctum:companion-ping"));
        if (!options.panelOpen()) {
          const name = (result?.name as string) || "Companion";
          const preview = messages[0]?.body?.trim() || "Wrote to you.";
          showAlert(name, preview.slice(0, 140));
        }
      }
    } catch {
      /* next tick */
    } finally {
      inFlight = false;
      first = false;
      schedule();
    }
  }

  function schedule() {
    if (stopped) return;
    if (timer) window.clearTimeout(timer);
    const ms = first
      ? FIRST_MS
      : document.visibilityState === "visible"
        ? VISIBLE_MS
        : HIDDEN_MS;
    timer = window.setTimeout(() => void tick(), ms);
  }

  function kick() {
    if (document.visibilityState !== "visible") return;
    if (timer) window.clearTimeout(timer);
    first = false;
    void tick();
  }

  document.addEventListener("visibilitychange", kick);
  schedule();

  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", kick);
  };
}
