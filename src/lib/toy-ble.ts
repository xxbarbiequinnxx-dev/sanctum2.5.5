const FFF0_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
const FFF1 = "0000fff1-0000-1000-8000-00805f9b34fb";
const FFF2 = "0000fff2-0000-1000-8000-00805f9b34fb";
const UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const WEVIBE_SERVICE = "f000bb03-0451-4000-b000-000000000000";
const WEVIBE_TX = "f000c000-0451-4000-b000-000000000000";
const WEVIBE_RX = "f000b000-0451-4000-b000-000000000000";

function hexNibble(n: number) {
  return n.toString(16);
}

function lovenseGen3Services() {
  const ids: string[] = [];
  for (const x of [4, 5]) {
    for (let y = 0; y < 16; y += 1) {
      for (const z of [3, 4]) {
        ids.push(`${hexNibble(x)}${hexNibble(y)}300001-002${z}-4bd4-bbd5-a6920e4c5653`);
      }
    }
  }
  return ids;
}

const LOVENSE_SERVICES = [FFF0_SERVICE, UART_SERVICE, ...lovenseGen3Services()];

export const LOVENSE_MODELS = [
  "Lush",
  "Lush 2",
  "Lush 3",
  "Lush 4",
  "Hush",
  "Hush 2",
  "Nora",
  "Max",
  "Max 2",
  "Edge",
  "Edge 2",
  "Domi",
  "Domi 2",
  "Osci",
  "Osci 2",
  "Osci 3",
  "Ferri",
  "Diamo",
  "Ambi",
  "Calor",
  "Gush",
  "Gush 2",
  "Hyphy",
  "Gravity",
  "Gemini",
  "Flexer",
  "Solace",
  "Solace Pro",
  "Ridge",
  "Tenera",
  "Dolce",
  "Mission",
  "Mission 2",
  "Lapis",
  "Exomoon",
  "Vulse",
  "Mini",
];

export const WEVIBE_MODELS = [
  "Chorus",
  "Sync",
  "Sync 2",
  "Melt",
  "Vector",
  "Pivot",
  "Tango",
  "Tango X",
  "Nova",
  "Nova 2",
  "Jive",
  "Ditto",
  "Verge",
  "Wish",
  "Moxie",
  "Bloom",
  "Classic",
  "4 Plus",
  "Rave",
  "Gala",
  "Wand",
  "Skeena",
  "Date Night",
  "Touch",
  "Bond",
  "Cougar",
];

const LOVENSE_PREFIXES = [
  "LVS",
  "LOVENSE",
  "Lovense",
  "LOVE-",
  "Lush",
  "Hush",
  "Nora",
  "Edge",
  "Domi",
  "Osci",
  "Ferri",
  "Diamo",
  "Ambi",
  "Calor",
  "Gush",
  "Hyphy",
  "Gravity",
  "Gemini",
  "Flexer",
  "Solace",
  "Ridge",
  "Tenera",
  "Dolce",
  "Mission",
  "Lapis",
  "Exomoon",
  "Vulse",
  "Max",
];

const WEVIBE_PREFIXES = [
  "We-Vibe",
  "WeVibe",
  "We Vibe",
  "Chorus",
  "Sync",
  "Melt",
  "Vector",
  "Pivot",
  "Tango",
  "Nova",
  "NOVAV2",
  "Jive",
  "Ditto",
  "Verge",
  "Wish",
  "Moxie",
  "Bloom",
  "Classic",
  "4 Plus",
  "4_Plus",
  "4plus",
  "Rave",
  "Gala",
  "Wand",
  "Skeena",
  "Cougar",
  "Rey",
  "Reina",
  "Touch",
  "Bond",
];

const OPTIONAL_SERVICES = [...LOVENSE_SERVICES, WEVIBE_SERVICE, WEVIBE_TX, WEVIBE_RX, UART_RX, UART_TX, FFF1, FFF2];

export type ToyBrand = "lovense" | "wevibe" | "any";
export type ToyKind = "ble" | "virtual";

export type ToyConnection = {
  name: string;
  kind: ToyKind;
  brand: "lovense" | "wevibe" | "virtual" | "unknown";
  motors: 1 | 2;
  setIntensity: (n: number) => Promise<void>;
  setMotors: (m1: number, m2: number) => Promise<void>;
  stop: () => Promise<void>;
  disconnect: () => void;
};

type GattChar = BluetoothRemoteGATTCharacteristicLike;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function encode(text: string) {
  return new TextEncoder().encode(text);
}

async function writeChar(char: GattChar, data: BufferSource) {
  if (char.writeValueWithoutResponse && (char.properties.writeWithoutResponse ?? true)) {
    try {
      await char.writeValueWithoutResponse(data);
      return;
    } catch {
      // fall through
    }
  }
  await char.writeValue(data);
}

function lovensePayload(level: number) {
  return lovenseMotors(level, level);
}

function lovenseMotors(a: number, b: number) {
  const v1 = Math.round((clamp(a) / 100) * 20);
  const v2 = Math.round((clamp(b) / 100) * 20);
  return encode(`Vibrate:${Math.max(v1, v2)};Vibrate1:${v1};Vibrate2:${v2};`);
}

function wevibePayload(level: number) {
  return wevibeMotors(level, level);
}

function wevibeMotors(a: number, b: number) {
  const n1 = Math.round((clamp(a) / 100) * 15);
  const n2 = Math.round((clamp(b) / 100) * 15);
  if (n1 === 0 && n2 === 0) return new Uint8Array([0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const xy = ((n1 & 0x0f) << 4) | (n2 & 0x0f);
  return new Uint8Array([0x0f, 0x03, 0x00, xy, 0x00, 0x03, 0x00, 0x00]);
}

function motorCount(name: string | undefined) {
  const n = (name ?? "").toLowerCase();
  const dual = [
    "edge",
    "nora",
    "max",
    "gemini",
    "dolce",
    "lapis",
    "solace",
    "chorus",
    "sync",
    "vector",
    "nova",
    "ridge",
    "flexer",
    "osci",
  ];
  return dual.some((item) => n.includes(item)) ? 2 : 1;
}

function brandFromName(name: string | undefined): "lovense" | "wevibe" | "unknown" {
  const n = (name ?? "").toLowerCase();
  if (!n) return "unknown";
  if (n.includes("lvs") || n.includes("lovense") || n.startsWith("love-")) return "lovense";
  if (n.includes("we-vibe") || n.includes("wevibe") || n.includes("we vibe")) return "wevibe";
  if (LOVENSE_MODELS.some((model) => n.includes(model.toLowerCase()))) return "lovense";
  if (WEVIBE_MODELS.some((model) => n.includes(model.toLowerCase()))) return "wevibe";
  return "unknown";
}

export function bluetoothAvailable() {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export async function connectVirtualToy(): Promise<ToyConnection> {
  return {
    name: "Virtual toy",
    kind: "virtual",
    brand: "virtual",
    motors: 2,
    setIntensity: async () => undefined,
    setMotors: async () => undefined,
    stop: async () => undefined,
    disconnect: () => undefined,
  };
}

function prefixesFor(brand: ToyBrand) {
  if (brand === "lovense") return LOVENSE_PREFIXES;
  if (brand === "wevibe") return WEVIBE_PREFIXES;
  return [...LOVENSE_PREFIXES, ...WEVIBE_PREFIXES];
}

async function requestToy(brand: ToyBrand): Promise<BluetoothDeviceLike> {
  const prefixes = prefixesFor(brand);
  try {
    return await navigator.bluetooth!.requestDevice({
      filters: prefixes.map((namePrefix) => ({ namePrefix })),
      optionalServices: OPTIONAL_SERVICES,
    });
  } catch (first) {
    try {
      return await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES,
      });
    } catch {
      throw first instanceof Error ? first : new Error("Could not open the Bluetooth picker.");
    }
  }
}

function writable(char: GattChar) {
  return Boolean(char.properties.write || char.properties.writeWithoutResponse || !char.properties);
}

async function probeWriter(
  server: BluetoothRemoteGATTServerLike,
  preferred: "lovense" | "wevibe" | "unknown",
): Promise<{ send: (m1: number, m2: number) => Promise<void>; brand: "lovense" | "wevibe" }> {
  const order: Array<"lovense" | "wevibe"> =
    preferred === "wevibe" ? ["wevibe", "lovense"] : ["lovense", "wevibe"];

  const known: Array<{ service: string; char: string; brand: "lovense" | "wevibe" }> = [
    { service: WEVIBE_SERVICE, char: WEVIBE_TX, brand: "wevibe" },
    { service: FFF0_SERVICE, char: FFF2, brand: "lovense" },
    { service: FFF0_SERVICE, char: FFF1, brand: "lovense" },
    { service: UART_SERVICE, char: UART_RX, brand: "lovense" },
  ];
  for (const serviceId of lovenseGen3Services()) {
    const tx = serviceId.replace("300001", "300002");
    known.push({ service: serviceId, char: tx, brand: "lovense" });
  }

  const tryChar = async (char: GattChar, brand: "lovense" | "wevibe") => {
    const payload = brand === "wevibe" ? wevibeMotors(0, 0) : lovenseMotors(0, 0);
    await writeChar(char, payload);
    return async (m1: number, m2: number) => {
      await writeChar(char, brand === "wevibe" ? wevibeMotors(m1, m2) : lovenseMotors(m1, m2));
    };
  };

  try {
    const services = await server.getPrimaryServices();
    for (const brand of order) {
      for (const service of services) {
        let chars: GattChar[] = [];
        try {
          chars = await service.getCharacteristics();
        } catch {
          continue;
        }
        for (const char of chars) {
          if (!writable(char)) continue;
          try {
            const send = await tryChar(char, brand);
            return { send, brand };
          } catch {
            // next characteristic
          }
        }
      }
    }
  } catch {
    // some browsers require exact UUID probes
  }

  for (const brand of order) {
    for (const probe of known.filter((item) => item.brand === brand)) {
      try {
        const service = await server.getPrimaryService(probe.service);
        const char = await service.getCharacteristic(probe.char);
        const send = await tryChar(char, probe.brand);
        return { send, brand: probe.brand };
      } catch {
        // next
      }
    }
  }

  throw new Error("Connected, but this toy's control service is not recognised. Try the other brand button, or the virtual toy.");
}

export async function connectBluetoothToy(brand: ToyBrand = "any"): Promise<ToyConnection> {
  if (!navigator.bluetooth) {
    throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on HTTPS, or the virtual toy.");
  }

  const device = await requestToy(brand);
  const gatt = device.gatt;
  if (!gatt) throw new Error("That device has no Bluetooth GATT server.");
  const server = await gatt.connect();
  const guessed = brand === "any" ? brandFromName(device.name) : brand;
  const { send, brand: resolved } = await probeWriter(server, guessed === "unknown" ? "lovense" : guessed);

  let last1 = -1;
  let last2 = -1;
  let lastAt = 0;
  let pending: { m1: number; m2: number } | null = null;
  let timer: number | null = null;
  let alive = true;

  const flush = async (m1: number, m2: number) => {
    if (!alive) return;
    const now = Date.now();
    if (now - lastAt < 80 && (m1 !== 0 || m2 !== 0)) {
      pending = { m1, m2 };
      if (timer == null) {
        timer = window.setTimeout(() => {
          timer = null;
          const next = pending;
          pending = null;
          if (next) void flush(next.m1, next.m2);
        }, 90);
      }
      return;
    }
    lastAt = now;
    last1 = m1;
    last2 = m2;
    await send(m1, m2);
  };

  const name = device.name || (resolved === "wevibe" ? "We-Vibe" : "Lovense");
  return {
    name,
    kind: "ble",
    brand: resolved,
    motors: motorCount(device.name) as 1 | 2,
    setIntensity: async (n: number) => {
      const level = clamp(n);
      if (level === last1 && level === last2) return;
      await flush(level, level);
    },
    setMotors: async (a: number, b: number) => {
      const m1 = clamp(a);
      const m2 = clamp(b);
      if (m1 === last1 && m2 === last2) return;
      await flush(m1, m2);
    },
    stop: async () => {
      pending = null;
      await send(0, 0);
      last1 = 0;
      last2 = 0;
    },
    disconnect: () => {
      alive = false;
      void send(0, 0).catch(() => undefined);
      try {
        gatt.disconnect();
      } catch {
        // already gone
      }
    },
  };
}
