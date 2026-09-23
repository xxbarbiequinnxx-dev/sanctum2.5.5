import { useEffect, useRef } from "react";
import { getLocationBoard, pingLocation } from "@/lib/api";
import { LOCATION_EVENT } from "@/lib/location";

export function LocationBeacon() {
  const watchRef = useRef<number | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function stop() {
      if (watchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    }

    async function start() {
      stop();
      try {
        const board = await getLocationBoard();
        if (cancelled || !board.mine.sharing || !navigator.geolocation) return;
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            if (now - lastSent.current < 12_000) return;
            lastSent.current = now;
            void pingLocation({
              data: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
              },
            }).catch(() => undefined);
          },
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 8_000, timeout: 20_000 },
        );
      } catch {
        // sharing is optional
      }
    }

    void start();
    const onChange = () => {
      lastSent.current = 0;
      void start();
    };
    window.addEventListener(LOCATION_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(LOCATION_EVENT, onChange);
      stop();
    };
  }, []);

  return null;
}
