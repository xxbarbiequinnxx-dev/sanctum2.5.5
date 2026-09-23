import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/api";
import { UserButton } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";

export function AccountMenu() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 16 });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const width = 176;
      setPos({
        top: rect.top,
        left: Math.min(Math.max(8, rect.right + 6), window.innerWidth - width - 8),
      });
    }
    setOpen((value) => !value);
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function wipe() {
    setBusy(true);
    try {
      await deleteAccount();
      try {
        await signOut("/login");
      } catch {
        window.location.href = "/login";
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <UserButton />
      <button
        ref={btnRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[80] min-w-44 rounded-lg border border-border bg-card p-1 shadow-soft"
              style={{ top: pos.top, left: pos.left }}
            >
              <button
                type="button"
                role="menuitem"
                className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-secondary"
                onClick={() => {
                  setOpen(false);
                  setConfirm(true);
                }}
              >
                Delete account
              </button>
            </div>,
            document.body,
          )
        : null}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this account?</DialogTitle>
            <DialogDescription>
              This removes your login, profile, companion, and private answers. A connected partner is unlinked and keeps the shared pages. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)} disabled={busy}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={() => void wipe()} disabled={busy}>
              {busy ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
