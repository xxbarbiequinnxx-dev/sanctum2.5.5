import { useEffect } from "react";
import { getBondSync, getMe, listRecentEvents } from "@/lib/api";
import { broadcastMe } from "@/lib/me-sync";
import { eventNotice, loadSeenEventId, requestAlertPermission, showAlert, storeSeenEventId, type BondEvent } from "@/lib/notify";

const EVENT = "sanctum:live";
const VISIBLE_MS = 800;
const HIDDEN_MS = 5000;

export function subscribeLive(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function useLiveReload(load: () => void | Promise<unknown>) {
  useEffect(() => {
    return subscribeLive(() => {
      void Promise.resolve(load()).catch(() => {});
    });
  }, [load]);
}

export function emitLive() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

async function flushPartnerNotices() {
  try {
    const [events, me] = await Promise.all([listRecentEvents(), getMe()]);
    if (!events.length) return;
    const seen = loadSeenEventId();
    const fresh = (events as BondEvent[]).filter((item) => item.id > seen).sort((a, b) => a.id - b.id);
    if (!fresh.length) {
      storeSeenEventId(Math.max(seen, events[0]?.id ?? 0));
      return;
    }
    const partnerName = me.partner?.displayName || "Your partner";
    for (const event of fresh) {
      const notice = eventNotice(event, partnerName);
      if (!notice) continue;
      showAlert(notice.title, notice.body);
    }
    storeSeenEventId(fresh[fresh.length - 1]!.id);
  } catch {
    /* next tick */
  }
}

export function startLiveSync() {
  if (typeof window === "undefined") return () => {};
  let stopped = false;
  let revision: string | null = null;
  let timer: number | null = null;
  let inFlight = false;
  let primed = false;

  async function tick() {
    if (stopped || inFlight) {
      if (!stopped && !inFlight) schedule();
      return;
    }
    inFlight = true;
    try {
      const snap = await getBondSync();
      if (stopped) return;
      if (revision != null && snap.revision !== revision) {
        emitLive();
        try {
          broadcastMe(await getMe());
        } catch {
          /* keep lists even if profile refresh fails */
        }
        if (primed) void flushPartnerNotices();
      }
      revision = snap.revision;
      if (!primed) {
        primed = true;
        try {
          const events = await listRecentEvents();
          const maxId = events[0]?.id ?? 0;
          if (loadSeenEventId() === 0) storeSeenEventId(maxId);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* next tick retries */
    } finally {
      inFlight = false;
      schedule();
    }
  }

  function schedule() {
    if (stopped) return;
    if (timer) window.clearTimeout(timer);
    const ms = document.visibilityState === "visible" ? VISIBLE_MS : HIDDEN_MS;
    timer = window.setTimeout(() => void tick(), ms);
  }

  function kick() {
    if (timer) window.clearTimeout(timer);
    void tick();
  }

  document.addEventListener("visibilitychange", kick);
  window.addEventListener("focus", kick);
  requestAlertPermission();
  void tick();

  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", kick);
    window.removeEventListener("focus", kick);
  };
}
