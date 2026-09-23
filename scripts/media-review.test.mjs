import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main = readFileSync('native/android/app/src/main/java/com/sanctum/chamber/MainActivity.java', 'utf8');
const media = readFileSync('src/lib/media-access.ts', 'utf8');
const entries = readFileSync('src/components/entry-form.tsx', 'utf8');
const manifest = readFileSync('native/android/app/src/main/AndroidManifest.xml', 'utf8');
const photo = readFileSync('src/components/photo-field.tsx', 'utf8');
const pdf = readFileSync('src/components/pdf-field.tsx', 'utf8');
test('camera permission refusal is handled', () => {
  assert.match(main, /if \(permitted\) launchNativeIntent\(\)/);
  assert.match(main, /Camera or microphone permission was denied/);
});
test('repeat native picker has a lifecycle guard and JS completion clears it', () => {
  assert.match(main, /if \(nativePick \|\| expectingResult\) return/);
  assert.match(media, /nativePickOpen = false/);
  assert.match(media, /window\.__sanctumNativeFile = undefined/);
});
test('PDF picker uses Documents and size/header validation', () => {
  assert.match(main, /Intent\.ACTION_OPEN_DOCUMENT/);
  assert.match(main, /PDFs must be 2 MB or smaller/);
  assert.match(main, /bytes\[0\] != '%'/);
  assert.match(pdf, /event\.currentTarget\.value = ""/);
});
test('camera and gallery repeat selections clear input values', () => {
  assert.match(photo, /function handleCamera[\s\S]*?event\.currentTarget\.value = ""/);
  assert.match(photo, /function handleGallery[\s\S]*?event\.currentTarget\.value = ""/);
});
test('created entry ID persists after first save', () => {
  assert.match(entries, /entryRef\.current = saved;/);
  assert.doesNotMatch(entries, /entryRef\.current = entry;\s*const persistSeq/);
});
test('provider and required scoped permissions configured', () => {
  for (const name of ['CAMERA','RECORD_AUDIO','POST_NOTIFICATIONS','ACCESS_FINE_LOCATION']) assert.match(manifest, new RegExp('android.permission.'+name));
  assert.match(manifest, /androidx\.core\.content\.FileProvider/);
  assert.doesNotMatch(manifest, /android.permission.READ_EXTERNAL_STORAGE|android.permission.MANAGE_EXTERNAL_STORAGE/);
});

test('PDF text can be inserted into entry notes', () => {
  const lib = readFileSync('src/lib/pdf.ts', 'utf8');
  assert.match(lib, /export async function extractPdfText/);
  assert.match(pdf, /Add text to Notes/);
  assert.match(entries, /onInsertText=/);
  assert.match(entries, /body: p\.body/);
});

test('PDF editing creates and persists a changed attachment', () => {
  const lib = readFileSync('src/lib/pdf.ts', 'utf8');
  assert.match(lib, /export async function appendTextPageToPdf/);
  assert.match(lib, /pdf\.addPage/);
  assert.match(pdf, /Edit PDF/);
  assert.match(pdf, /onChange\(pdfs\.map/);
  assert.match(entries, /applyPdfs/);
});

test('native media picker type includes combined media mode', () => {
  const bridge = readFileSync('src/lib/media-access.ts', 'utf8');
  assert.match(bridge, /NativePickKind[^;]+media/);
});
