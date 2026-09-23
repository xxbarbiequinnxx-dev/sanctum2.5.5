/** Store-only ZIP so the browser can mint Mac .app bundles with Unix executable bits. */

export type MacAppKind = "sanctum" | "dominant" | "submissive";

export const MAC_APPS: { kind: MacAppKind; name: string; copy: string }[] = [
  { kind: "sanctum", name: "Sanctum.app", copy: "Opens Sanctum in its own window." },
  { kind: "dominant", name: "Sanctum Dominant.app", copy: "Opens the Dominant door." },
  { kind: "submissive", name: "Sanctum Submissive.app", copy: "Opens the Submissive door." },
];

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]!;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function u16(value: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = value & 0xff;
  out[1] = (value >> 8) & 0xff;
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >> 8) & 0xff;
  out[2] = (value >> 16) & 0xff;
  out[3] = (value >> 24) & 0xff;
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

type ZipEntry = {
  path: string;
  data: Uint8Array;
  mode: number;
};

function zipStore(entries: ZipEntry[]): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime =
    ((now.getSeconds() / 2) | 0) |
    (now.getMinutes() << 5) |
    (now.getHours() << 11);
  const dosDate =
    now.getDate() | ((now.getMonth() + 1) << 5) | ((now.getFullYear() - 1980) << 9);

  for (const entry of entries) {
    const name = encodeUtf8(entry.path);
    const crc = crc32(entry.data);
    const size = entry.data.length;
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(size),
      u32(size),
      u16(name.length),
      u16(0),
      name,
      entry.data,
    ]);
    const madeBy = (3 << 8) | 20;
    const external = (entry.mode & 0xffff) << 16;
    const central = concat([
      u32(0x02014b50),
      u16(madeBy),
      u16(20),
      u16(0),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(size),
      u32(size),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(external >>> 0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralDir = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);
  return new Blob([concat([...locals, centralDir, end]) as BlobPart], { type: "application/zip" });
}

function plist(id: string, name: string, executable: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>${name}</string>
  <key>CFBundleExecutable</key>
  <string>${executable}</string>
  <key>CFBundleIdentifier</key>
  <string>${id}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${name}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.lifestyle</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

function launcher(defaultUrl: string): string {
  return `#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL_FILE="$ROOT/Resources/sanctum-url.txt"
URL="$(tr -d '[:space:]' < "$URL_FILE" 2>/dev/null || true)"

ask_url() {
  URL="$(osascript <<'APPLESCRIPT'
try
  tell application "System Events"
    activate
    set answer to text returned of (display dialog "Paste your Sanctum web address:" default answer "https://" with title "Sanctum" buttons {"Cancel", "Open"} default button "Open")
  end tell
  return answer
on error
  return ""
end try
APPLESCRIPT
)"
  if [ -n "$URL" ]; then
    printf '%s\\n' "$URL" > "$URL_FILE" || true
  fi
}

if [ -z "$URL" ]; then
  URL="${defaultUrl}"
fi
case "$URL" in
  https://sanctum.local|https://sanctum.local/|http://sanctum.local|http://sanctum.local/) URL="" ;;
esac
if [ -z "$URL" ]; then
  ask_url
fi
if [ -z "$URL" ]; then
  exit 0
fi
case "$URL" in
  http://*|https://*) ;;
  *) URL="https://$URL" ;;
esac

if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" --new-window
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL" --new-window
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args --app="$URL" --new-window
else
  open "$URL"
fi
`;
}

function appSpec(kind: MacAppKind, origin: string) {
  if (kind === "dominant") {
    return {
      folder: "Sanctum Dominant.app",
      display: "Sanctum Dominant",
      executable: "SanctumDominant",
      id: "com.sanctum.chamber.dominant",
      url: `${origin}/login?door=dominant`,
    };
  }
  if (kind === "submissive") {
    return {
      folder: "Sanctum Submissive.app",
      display: "Sanctum Submissive",
      executable: "SanctumSubmissive",
      id: "com.sanctum.chamber.submissive",
      url: `${origin}/login?door=submissive`,
    };
  }
  return {
    folder: "Sanctum.app",
    display: "Sanctum",
    executable: "Sanctum",
    id: "com.sanctum.chamber",
    url: `${origin}/`,
  };
}

function bundleEntries(kind: MacAppKind, origin: string, icon?: Uint8Array | null): ZipEntry[] {
  const spec = appSpec(kind, origin);
  const root = spec.folder;
  const file = (path: string, text: string, executable = false): ZipEntry => ({
    path,
    data: encodeUtf8(text),
    mode: executable ? 0o100755 : 0o100644,
  });
  const dir = (path: string): ZipEntry => ({
    path: path.endsWith("/") ? path : `${path}/`,
    data: new Uint8Array(),
    mode: 0o040755,
  });
  const entries = [
    dir(`${root}/`),
    dir(`${root}/Contents/`),
    dir(`${root}/Contents/MacOS/`),
    dir(`${root}/Contents/Resources/`),
    file(`${root}/Contents/PkgInfo`, "APPL????"),
    file(`${root}/Contents/Info.plist`, plist(spec.id, spec.display, spec.executable)),
    file(`${root}/Contents/MacOS/${spec.executable}`, launcher(spec.url), true),
    file(`${root}/Contents/Resources/sanctum-url.txt`, `${spec.url}\n`),
  ];
  if (icon && icon.byteLength) {
    entries.push({
      path: `${root}/Contents/Resources/AppIcon.icns`,
      data: icon,
      mode: 0o100644,
    });
  }
  return entries;
}

const README = `Sanctum for Mac
================

Unzip this file. You will see three apps:

  • Sanctum.app              — the full chamber
  • Sanctum Dominant.app     — the Dominant door
  • Sanctum Submissive.app   — the Submissive door

Drag them into Applications.

The first time you open one, macOS may say it is from an unidentified developer.
Right-click the app, choose Open, then Open again.

Each app opens Sanctum in its own window (Chrome, Edge, or Brave if you have
one; otherwise your default browser).
`;

export function buildMacAppsZip(
  origin: string,
  kinds: MacAppKind[] = ["sanctum", "dominant", "submissive"],
  icon?: Uint8Array | null,
): Blob {
  const base = origin.replace(/\/+$/, "");
  const entries: ZipEntry[] = [
    { path: "README.txt", data: encodeUtf8(README), mode: 0o100644 },
  ];
  for (const kind of kinds) entries.push(...bundleEntries(kind, base, icon));
  return zipStore(entries);
}

export function macAppFileName(kinds: MacAppKind[]): string {
  if (kinds.length === 1 && kinds[0] === "dominant") return "Sanctum-Dominant.app.zip";
  if (kinds.length === 1 && kinds[0] === "submissive") return "Sanctum-Submissive.app.zip";
  if (kinds.length === 1) return "Sanctum.app.zip";
  return "Sanctum-Mac-Apps.zip";
}

let cachedIcon: Uint8Array | null | undefined;

async function loadAppIcon(): Promise<Uint8Array | null> {
  if (cachedIcon !== undefined) return cachedIcon;
  try {
    const res = await fetch("/AppIcon.icns");
    if (!res.ok) {
      cachedIcon = null;
      return null;
    }
    cachedIcon = new Uint8Array(await res.arrayBuffer());
    return cachedIcon;
  } catch {
    cachedIcon = null;
    return null;
  }
}

export async function downloadMacApps(origin: string, kinds?: MacAppKind[]) {
  const selected = kinds?.length ? kinds : (["sanctum", "dominant", "submissive"] as MacAppKind[]);
  const icon = await loadAppIcon();
  const blob = buildMacAppsZip(origin, selected, icon);
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = macAppFileName(selected);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}
