import { Bluetooth, Pause, Play, Plus, Radio, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteToyPattern,
  listToyPatterns,
  lookupSpotify,
  saveToyPattern,
} from "@/lib/api";
import { bluetoothAvailable, connectBluetoothToy, connectVirtualToy, LOVENSE_MODELS, WEVIBE_MODELS, type ToyBrand, type ToyConnection } from "@/lib/toy-ble";
import type { SpotifyLink, ToyPattern, ToyPatternStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

export function ToyControl() {
  const toyRef = useRef<ToyConnection | null>(null);
  const [connected, setConnected] = useState<ToyConnection | null>(null);
  const [intensity, setIntensity] = useState(0);
  const [intensity2, setIntensity2] = useState(0);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [patterns, setPatterns] = useState<ToyPattern[]>([]);
  const [draftTitle, setDraftTitle] = useState("Pulse");
  const [draftSteps, setDraftSteps] = useState<ToyPatternStep[]>([
    { intensity: 30, ms: 800 },
    { intensity: 70, ms: 800 },
    { intensity: 0, ms: 400 },
  ]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playTimer = useRef<number | null>(null);
  const listenRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [listening, setListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.6);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotify, setSpotify] = useState<SpotifyLink | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localTrack, setLocalTrack] = useState<string | null>(null);
  const [speedOn, setSpeedOn] = useState(false);
  const [simulateOn, setSimulateOn] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [minKmh, setMinKmh] = useState(0);
  const [maxKmh, setMaxKmh] = useState(80);
  const [curve, setCurve] = useState<"linear" | "late" | "early">("linear");
  const watchRef = useRef<number | null>(null);
  const lastFix = useRef<{ t: number; lat: number; lon: number } | null>(null);
  const mapRef = useRef({ min: 0, max: 80, curve: "linear" as "linear" | "late" | "early" });
  mapRef.current = { min: minKmh, max: maxKmh, curve };

  const lastSample = useRef({ t: 0, i1: 0, i2: 0 });
  const recordingRef = useRef(false);

  const apply = useCallback(async (value: number, value2?: number) => {
    const n = Math.max(0, Math.min(100, Math.round(value)));
    const n2 = Math.max(0, Math.min(100, Math.round(value2 ?? value)));
    setIntensity(n);
    setIntensity2(n2);
    const toy = toyRef.current;
    if (toy?.motors === 2) await toy.setMotors(n, n2);
    else await toy?.setIntensity(n);
    if (recordingRef.current) sampleRecord(n, n2);
  }, []);

  const loadPatterns = useCallback(async () => {
    try {
      setPatterns(await listToyPatterns());
    } catch {
      setPatterns([]);
    }
  }, []);

  useEffect(() => {
    void loadPatterns();
    return () => {
      stopPlay();
      stopListen();
      stopSpeed();
      toyRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLiveReload(loadPatterns);

  async function connect(kind: "ble" | "virtual", brand: ToyBrand = "any") {
    setBusy(true);
    try {
      toyRef.current?.disconnect();
      const next = kind === "ble" ? await connectBluetoothToy(brand) : await connectVirtualToy();
      toyRef.current = next;
      setConnected(next);
      await next.setIntensity(intensity);
      toast.success(
        kind === "ble"
          ? `Connected to ${next.name}${next.brand === "wevibe" ? " · We-Vibe" : next.brand === "lovense" ? " · Lovense" : ""}`
          : "Virtual toy is live.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    stopPlay();
    stopListen();
    stopSpeed();
    await toyRef.current?.stop();
    toyRef.current?.disconnect();
    toyRef.current = null;
    setConnected(null);
    setIntensity(0);
    setIntensity2(0);
  }

  function sampleRecord(i1: number, i2: number) {
    const now = Date.now();
    const dt = now - lastSample.current.t;
    if (dt < 140 && lastSample.current.t) return;
    const ms = Math.max(100, lastSample.current.t ? dt : 200);
    lastSample.current = { t: now, i1, i2 };
    setDraftSteps((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.intensity === i1 && (last.intensity2 ?? last.intensity) === i2) {
        return prev.map((item, index) => (index === prev.length - 1 ? { ...item, ms: item.ms + ms } : item));
      }
      return [...prev, { intensity: i1, intensity2: i2, ms }].slice(0, 80);
    });
  }

  function toggleRecord() {
    if (recording) {
      recordingRef.current = false;
      setRecording(false);
      toast.success("Pattern captured from the pad.");
      return;
    }
    setDraftSteps([]);
    lastSample.current = { t: Date.now(), i1: intensity, i2: intensity2 };
    recordingRef.current = true;
    setRecording(true);
    toast.message("Drag the pad. Stop when the pattern is done.");
  }

  function stopPlay() {
    if (playTimer.current != null) window.clearTimeout(playTimer.current);
    playTimer.current = null;
    setPlayingId(null);
  }

  function playSteps(id: string, steps: ToyPatternStep[], loop: boolean) {
    stopPlay();
    if (!toyRef.current) {
      toast.message("Connect a toy first.");
      return;
    }
    setPlayingId(id);
    let index = 0;
    const tick = () => {
      const step = steps[index];
      if (!step) {
        if (loop) {
          index = 0;
          tick();
          return;
        }
        void apply(0);
        setPlayingId(null);
        return;
      }
      void apply(step.intensity, step.intensity2 ?? step.intensity);
      playTimer.current = window.setTimeout(() => {
        index += 1;
        tick();
      }, step.ms);
    };
    tick();
  }

  function stopListen() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      sourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    sourceRef.current = null;
    void listenRef.current?.close();
    listenRef.current = null;
    setListening(false);
  }

  function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const toRad = (n: number) => (n * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function intensityFromKmh(kmh: number) {
    const { min, max, curve: shape } = mapRef.current;
    const span = Math.max(1, max - min);
    let t = (kmh - min) / span;
    t = Math.max(0, Math.min(1, t));
    if (shape === "late") t = t * t;
    if (shape === "early") t = Math.sqrt(t);
    return Math.round(t * 100);
  }

  function stopSpeed() {
    if (watchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
    lastFix.current = null;
    setSpeedOn(false);
    setSimulateOn(false);
  }

  function startSpeed() {
    if (!toyRef.current) {
      toast.message("Connect a toy first.");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("This browser has no GPS. Use Simulate speed.");
      return;
    }
    stopListen();
    stopPlay();
    setSimulateOn(false);
    setSpeedOn(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        let mps = pos.coords.speed;
        if (mps == null || mps < 0) {
          const prev = lastFix.current;
          const now = pos.timestamp || Date.now();
          if (prev) {
            const meters = haversineMeters(prev, {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
            const dt = Math.max(0.25, (now - prev.t) / 1000);
            mps = meters / dt;
          } else {
            mps = 0;
          }
        }
        lastFix.current = {
          t: pos.timestamp || Date.now(),
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        const kmh = mps * 3.6;
        setSpeedKmh(kmh);
        void apply(intensityFromKmh(kmh));
      },
      (err) => {
        toast.error(err.message || "Could not read vehicle speed. Allow location, or simulate.");
        stopSpeed();
      },
      { enableHighAccuracy: true, maximumAge: 400, timeout: 10000 },
    );
  }

  async function startMic() {
    stopListen();
    stopSpeed();
    if (!toyRef.current) {
      toast.message("Connect a toy first.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      listenRef.current = ctx;
      sourceRef.current = source;
      setListening(true);
      const data = new Uint8Array(analyser.fftSize);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) {
          const n = (v - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / data.length);
        void apply(Math.min(100, rms * 100 * sensitivity * 3.2));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      toast.error("Microphone access was denied. Allow it to follow sound or Spotify.");
    }
  }

  async function followFile() {
    const el = audioRef.current;
    if (!el || !toyRef.current) {
      toast.message("Connect a toy and load a track first.");
      return;
    }
    stopListen();
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    const source = ctx.createMediaElementSource(el);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    listenRef.current = ctx;
    sourceRef.current = source;
    setListening(true);
    const data = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) {
        const n = (v - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / data.length);
      void apply(Math.min(100, rms * 100 * sensitivity * 2.4));
      rafRef.current = requestAnimationFrame(loop);
    };
    void el.play();
    loop();
  }

  async function loadSpotify() {
    try {
      const link = await lookupSpotify({ data: { url: spotifyUrl } });
      setSpotify(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that Spotify link.");
    }
  }

  async function persistPattern() {
    if (!draftTitle.trim() || draftSteps.length === 0) {
      toast.error("Name the pattern and add at least one step.");
      return;
    }
    try {
      const saved = await saveToyPattern({
        data: { title: draftTitle.trim(), steps: draftSteps },
      });
      setPatterns((prev) => [saved, ...prev]);
      toast.success("Pattern saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  async function removePattern(id: number) {
    try {
      await deleteToyPattern({ data: { id } });
      setPatterns((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The current</p>
        <h1 className="mt-1 font-display text-4xl font-medium">Toys</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pair any Lovense or We-Vibe over Bluetooth, write a pattern, follow sound or Spotify, and drag a finger on the pad to raise or lower intensity.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Connection</h2>
            <p className="text-sm text-muted-foreground">
              {connected
                ? `${connected.name} · ${
                    connected.brand === "lovense"
                      ? "Lovense"
                      : connected.brand === "wevibe"
                        ? "We-Vibe"
                        : connected.kind === "ble"
                          ? "Bluetooth"
                          : "Virtual"
                  }`
                : bluetoothAvailable()
                  ? "Choose Lovense or We-Vibe, then pick the toy from the Bluetooth list."
                  : "This browser has no Web Bluetooth. Use the virtual toy, or Chrome/Edge on HTTPS for hardware."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <Button variant="outline" onClick={() => void disconnect()}>
                Disconnect
              </Button>
            ) : (
              <>
                <Button onClick={() => void connect("ble", "lovense")} disabled={busy || !bluetoothAvailable()}>
                  <Bluetooth />
                  Lovense
                </Button>
                <Button onClick={() => void connect("ble", "wevibe")} disabled={busy || !bluetoothAvailable()}>
                  <Bluetooth />
                  We-Vibe
                </Button>
                <Button variant="secondary" onClick={() => void connect("virtual")} disabled={busy}>
                  <Radio />
                  Virtual toy
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <SupportedList brand="Lovense" models={LOVENSE_MODELS} />
        <SupportedList brand="We-Vibe" models={WEVIBE_MODELS} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <IntensityPad
          value={intensity}
          value2={intensity2}
          motors={connected?.motors ?? 1}
          disabled={!connected}
          onChange={(n, n2) => void apply(n, n2)}
        />
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Level</h2>
          <p className="mt-6 text-center font-display text-6xl tabular-nums">
            {intensity}
            {connected?.motors === 2 ? <span className="text-3xl text-muted-foreground"> / {intensity2}</span> : null}
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            disabled={!connected}
            onChange={(e) => void apply(Number(e.target.value), connected?.motors === 2 ? intensity2 : undefined)}
            className="mt-4 w-full accent-primary"
          />
          {connected?.motors === 2 ? (
            <input
              type="range"
              min={0}
              max={100}
              value={intensity2}
              disabled={!connected}
              onChange={(e) => void apply(intensity, Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          ) : null}
          <Button
            className="mt-4 w-full"
            variant="outline"
            disabled={!connected}
            onClick={() => {
              stopPlay();
              stopListen();
              stopSpeed();
              void apply(0);
            }}
          >
            Stop
          </Button>
          <ToyPulse intensity={intensity} connected={Boolean(connected)} />
        </section>
      </div>

      <VehicleSpeed
        connected={Boolean(connected)}
        speedOn={speedOn}
        simulateOn={simulateOn}
        speedKmh={speedKmh}
        minKmh={minKmh}
        maxKmh={maxKmh}
        curve={curve}
        intensity={intensityFromKmh(speedKmh)}
        onMin={setMinKmh}
        onMax={setMaxKmh}
        onCurve={setCurve}
        onFollow={() => (speedOn ? stopSpeed() : startSpeed())}
        onSimulate={() => {
          if (simulateOn) {
            setSimulateOn(false);
            return;
          }
          if (!toyRef.current) {
            toast.message("Connect a toy first.");
            return;
          }
          if (watchRef.current != null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchRef.current);
          }
          watchRef.current = null;
          setSpeedOn(false);
          setSimulateOn(true);
          void apply(intensityFromKmh(speedKmh));
        }}
        onSpeed={(kmh) => {
          setSpeedKmh(kmh);
          void apply(intensityFromKmh(kmh));
        }}
      />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Patterns</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A sequence of intensities the toy will walk. Record from the pad, or add steps by hand.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Pattern name" />
          <Button variant="secondary" onClick={() => void persistPattern()}>
            Save pattern
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={recording ? "default" : "outline"} onClick={toggleRecord} disabled={!connected && !recording}>
            {recording ? "Stop recording" : "Record from pad"}
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {draftSteps.map((step, index) => (
            <li key={index} className="grid grid-cols-[1fr_7rem_2.5rem] items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={step.intensity}
                onChange={(e) => {
                  const intensityValue = Number(e.target.value);
                  setDraftSteps((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, intensity: intensityValue } : item)),
                  );
                }}
                className="accent-primary"
              />
              <Input
                type="number"
                min={100}
                step={100}
                value={(step.ms / 1000).toFixed(1)}
                onChange={(e) => {
                  const seconds = Number(e.target.value);
                  setDraftSteps((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, ms: Math.max(100, Math.round(seconds * 1000)) } : item,
                    ),
                  );
                }}
                aria-label="Seconds"
              />
              <button
                type="button"
                className="grid size-10 place-items-center text-muted-foreground"
                onClick={() => setDraftSteps((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove step"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDraftSteps((prev) => [...prev, { intensity: 50, ms: 800 }])}
          >
            <Plus />
            Step
          </Button>
          <Button
            size="sm"
            disabled={!connected}
            onClick={() => playSteps("draft", draftSteps, false)}
          >
            <Play />
            Play
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!connected}
            onClick={() => playSteps("draft-loop", draftSteps, true)}
          >
            Loop
          </Button>
          {playingId ? (
            <Button size="sm" variant="outline" onClick={stopPlay}>
              <Pause />
              Halt
            </Button>
          ) : null}
        </div>
        {patterns.length ? (
          <div className="mt-5 space-y-2">
            {patterns.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-secondary/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.steps.length} steps</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => playSteps(`p-${item.id}`, item.steps, true)}>
                    Play
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void removePattern(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Sound</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The toy follows sound — a voice, a scene, or Spotify playing through the speaker.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => (listening ? stopListen() : void startMic())} disabled={!connected && !listening}>
            {recording ? "Stop listening" : "Follow sound"}
          </Button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Sensitivity
            <input
              type="range"
              min={0.4}
              max={3}
              step={0.1}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-28 accent-primary"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Spotify</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste a playlist or track. Play it here, then follow sound so the toy rides the music.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/…"
          />
          <Button variant="secondary" onClick={() => void loadSpotify()}>
            Load
          </Button>
        </div>
        {spotify ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <iframe
              title={spotify.title}
              src={spotify.embed}
              className="h-80 w-full bg-secondary"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        ) : null}
        <div className="mt-4 space-y-2">
          <Label>Or a local track</Label>
          <input
            type="file"
            accept="audio/*"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (localTrack) URL.revokeObjectURL(localTrack);
              setLocalTrack(URL.createObjectURL(file));
            }}
          />
          {localTrack ? (
            <div className="space-y-2">
              <audio ref={audioRef} src={localTrack} controls className="w-full" />
              <Button size="sm" onClick={() => void followFile()} disabled={!connected}>
                Follow this track
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SupportedList({ brand, models }: { brand: string; models: string[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-2xl">{brand}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Paired over Bluetooth from this page.</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{models.join(" · ")}</p>
    </section>
  );
}

function VehicleSpeed({
  connected,
  speedOn,
  simulateOn,
  speedKmh,
  minKmh,
  maxKmh,
  curve,
  intensity,
  onMin,
  onMax,
  onCurve,
  onFollow,
  onSimulate,
  onSpeed,
}: {
  connected: boolean;
  speedOn: boolean;
  simulateOn: boolean;
  speedKmh: number;
  minKmh: number;
  maxKmh: number;
  curve: "linear" | "late" | "early";
  intensity: number;
  onMin: (n: number) => void;
  onMax: (n: number) => void;
  onCurve: (value: "linear" | "late" | "early") => void;
  onFollow: () => void;
  onSimulate: () => void;
  onSpeed: (kmh: number) => void;
}) {
  const fill = Math.max(3, Math.min(100, intensity));
  const mph = speedKmh * 0.621371;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-2xl">Vehicle</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        The toy follows road speed from GPS. Passenger only — do not operate a vehicle while using it.
      </p>
      <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-raised">
        <div
          className="absolute inset-x-0 bottom-0 bg-primary"
          style={{ height: `${fill}%`, opacity: intensity ? 0.85 : 0.22 }}
        />
        <p className="absolute inset-x-0 top-8 text-center font-display text-6xl tabular-nums leading-none">
          {speedKmh.toFixed(0)}
        </p>
        <p className="absolute inset-x-0 top-[4.75rem] text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
          km/h · {mph.toFixed(0)} mph · toy {intensity}
        </p>
        <p className="absolute inset-x-0 bottom-3 text-center text-[11px] text-muted-foreground">
          Idle {minKmh} → peak {maxKmh}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <Label>Idle at (km/h)</Label>
          <Input
            type="number"
            min={0}
            value={minKmh}
            onChange={(e) => onMin(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label className="block space-y-1.5">
          <Label>Peak at (km/h)</Label>
          <Input
            type="number"
            min={1}
            value={maxKmh}
            onChange={(e) => onMax(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>
      <div className="mt-4">
        <Label>Curve</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {(
            [
              ["linear", "Linear"],
              ["late", "Late peak"],
              ["early", "Early peak"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onCurve(value)}
              className={cn(
                "h-10 rounded-lg text-xs",
                curve === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onFollow} disabled={!connected && !speedOn}>
          {speedOn ? "Stop GPS" : "Follow vehicle"}
        </Button>
        <Button variant="secondary" disabled={!connected && !simulateOn} onClick={onSimulate}>
          {simulateOn ? "Stop simulate" : "Simulate speed"}
        </Button>
      </div>
      {simulateOn ? (
        <label className="mt-4 block space-y-1.5">
          <Label>Simulated km/h</Label>
          <input
            type="range"
            min={0}
            max={Math.max(40, maxKmh + 20)}
            value={speedKmh}
            onChange={(e) => onSpeed(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </label>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Follow uses the phone GPS. Simulate is for preview without a car.
        </p>
      )}
    </section>
  );
}

function IntensityPad({
  value,
  value2 = 0,
  motors = 1,
  disabled,
  onChange,
}: {
  value: number;
  value2?: number;
  motors?: number;
  disabled?: boolean;
  onChange: (n: number, n2?: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, 0 | 1>());

  function readY(event: React.PointerEvent<HTMLDivElement>, laneEl?: HTMLElement | null) {
    const box = laneEl ?? ref.current;
    if (!box) return 0;
    const rect = box.getBoundingClientRect();
    const y = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    return Math.round(y * 100);
  }

  if (motors > 1) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Touch</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Two motors. One finger per lane — independently, or together.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([0, 1] as const).map((lane) => {
            const current = lane === 0 ? value : value2;
            return (
              <div
                key={lane}
                className={cn(
                  "relative h-72 touch-none overflow-hidden rounded-xl border border-border bg-raised",
                  disabled && "opacity-50",
                )}
                onPointerDown={(event) => {
                  if (disabled) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pointers.current.set(event.pointerId, lane);
                  const n = readY(event, event.currentTarget);
                  if (lane === 0) onChange(n, value2);
                  else onChange(value, n);
                }}
                onPointerMove={(event) => {
                  if (disabled || event.buttons === 0) return;
                  const which = pointers.current.get(event.pointerId) ?? lane;
                  const n = readY(event, event.currentTarget);
                  if (which === 0) onChange(n, value2);
                  else onChange(value, n);
                }}
                onPointerUp={(event) => pointers.current.delete(event.pointerId)}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-primary"
                  style={{ height: `${Math.max(current, 3)}%`, opacity: current ? 0.85 : 0.25 }}
                />
                <p className="absolute inset-x-0 top-4 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Motor {lane + 1}
                </p>
                <p className="absolute inset-x-0 bottom-4 text-center font-display text-3xl tabular-nums">{current}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-2xl">Touch</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Drag a finger up to raise intensity, down to lower it. Record a pattern from this pad.
      </p>
      <div
        ref={ref}
        className={cn(
          "relative h-72 touch-none overflow-hidden rounded-xl border border-border bg-raised",
          disabled && "opacity-50",
        )}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          onChange(readY(event));
        }}
        onPointerMove={(event) => {
          if (disabled || event.buttons === 0) return;
          onChange(readY(event));
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-primary"
          style={{ height: `${Math.max(value, 3)}%`, opacity: value ? 0.85 : 0.25 }}
        />
        <p className="absolute inset-x-0 top-4 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {disabled ? "Connect a toy" : "Hold and slide"}
        </p>
        <p className="absolute inset-x-0 bottom-4 text-center font-display text-3xl tabular-nums">{value}</p>
      </div>
    </section>
  );
}

function ToyPulse({ intensity, connected }: { intensity: number; connected: boolean }) {
  const scale = 0.7 + (intensity / 100) * 0.55;
  return (
    <div className="mt-6 grid place-items-center">
      <div
        className={cn(
          "size-16 rounded-full border border-primary/40 bg-primary/20",
          connected && intensity > 0 && "shadow-[0_0_32px_rgb(196_92_92_/_0.45)]",
        )}
        style={{ transform: `scale(${scale})`, transition: "transform 120ms linear" }}
      />
    </div>
  );
}
