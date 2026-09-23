import type { Me } from "@/lib/types";

const EVENT = "sanctum:me";

export function broadcastMe(me: Me) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Me>(EVENT, { detail: me }));
}

export function subscribeMe(cb: (me: Me) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const next = (event as CustomEvent<Me>).detail;
    if (next) cb(next);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
