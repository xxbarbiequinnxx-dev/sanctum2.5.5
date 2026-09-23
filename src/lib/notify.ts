import { toast } from "sonner";

export type BondEvent = {
  id: number;
  actorId: string;
  action: string;
  entity: string;
  title: string;
  detail: string;
  createdAt: string;
};

export function eventNotice(
  event: BondEvent,
  actorName: string,
): { title: string; body: string } | null {
  const who = actorName.trim() || "Your partner";
  const subject = event.title.trim();
  const entity = event.entity.replace(/_/g, " ");
  switch (event.action) {
    case "message":
      return { title: `${who} sent a message`, body: subject || "Open Messages to read it." };
    case "photo":
      return { title: `${who} sent a photo`, body: subject || "A still from the album." };
    case "video":
      return { title: `${who} sent a video`, body: subject || "Open Messages to watch it." };
    case "voice":
      return { title: `${who} sent a voice note`, body: subject || "Open Messages to listen." };
    case "completed":
      return { title: `${who} completed a ${entity || "item"}`, body: subject || "Marked done." };
    case "created":
      return { title: `${who} added a ${entity || "entry"}`, body: subject || "Something new is on the page." };
    case "updated":
      return { title: `${who} changed a ${entity || "entry"}`, body: subject || event.detail || "An update in Sanctum." };
    case "deleted":
      return { title: `${who} removed a ${entity || "entry"}`, body: subject || "It is gone." };
    case "bought":
      return { title: `${who} bought ${subject || "an item"}`, body: event.detail || "Paid with points." };
    case "talk":
      return { title: `${who} answered in Talk`, body: subject || "A prompt, quiz, or weekly card." };
    case "journal":
      return { title: `${who} shared a journal page`, body: subject || "Open Journal to read it." };
    case "points":
      return { title: `${who} moved points`, body: event.detail || subject || "The ledger changed." };
    case "permissions":
      return { title: `${who} changed permissions`, body: event.detail || "Check Settings." };
    case "reopened":
      return { title: `${who} reopened a ${entity || "item"}`, body: subject };
    default:
      if (!entity && !subject) return null;
      return { title: `${who} updated Sanctum`, body: [entity, subject, event.detail].filter(Boolean).join(" · ") };
  }
}

export function requestAlertPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") void Notification.requestPermission();
}

export function showAlert(title: string, body: string) {
  if (typeof window === "undefined") return;
  toast.message(title, { description: body });
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, tag: `sanctum-${title}` });
    } catch {
      /* ignore */
    }
  }
}

const SEEN_KEY = "sanctum-notify-seen";

export function loadSeenEventId() {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(SEEN_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

export function storeSeenEventId(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, String(id));
}
