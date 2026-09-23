import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type SaveStatus = "saved" | "saving" | "error";

export function useAutoSave(
  signature: string,
  save: () => Promise<void>,
  options?: { delay?: number; enabled?: boolean; resetKey?: string | number },
) {
  const delay = options?.delay ?? 500;
  const enabled = options?.enabled ?? true;
  const resetKey = options?.resetKey;
  const skip = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;
  const gen = useRef(0);
  const [status, setStatus] = useState<SaveStatus>("saved");

  useEffect(() => {
    skip.current = true;
  }, [resetKey]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (!enabled) return;
    const id = ++gen.current;
    const timer = window.setTimeout(() => {
      setStatus("saving");
      void saveRef
        .current()
        .then(() => {
          if (gen.current === id) setStatus("saved");
        })
        .catch((err) => {
          if (gen.current === id) setStatus("error");
          toast.error(err instanceof Error ? err.message : "Could not save.");
        });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [signature, delay, enabled]);

  return status;
}

export function SaveHint({ status }: { status: SaveStatus }) {
  return (
    <p className="text-xs text-muted-foreground">
      {status === "saving" ? "Saving…" : status === "error" ? "Could not save." : "Saved."}
    </p>
  );
}
