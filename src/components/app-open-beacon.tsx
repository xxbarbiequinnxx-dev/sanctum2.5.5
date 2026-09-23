import { useEffect } from "react";
import { recordAppOpen } from "@/lib/api";

export function AppOpenBeacon() {
  useEffect(() => {
    void recordAppOpen().catch(() => undefined);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void recordAppOpen().catch(() => undefined);
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
