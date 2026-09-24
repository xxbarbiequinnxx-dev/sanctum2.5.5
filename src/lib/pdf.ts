import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PdfAttachment } from "@/lib/types";

// pdfjs-dist relies on browser-only DOMMatrix at module initialization.
// Never import it at module scope: this file is also loaded during SSR.

export const PDF_META_KEY = "_pdfs";
export const MAX_PDFS = 3;
export const MAX_PDF_BYTES = 2_000_000;
export const MAX_EXTRACTED_PDF_TEXT = 30_000;

export function isPdfFile(file: File) {
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name);
}

export function parsePdfs(raw: string | undefined | null): PdfAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is PdfAttachment =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as PdfAttachment).name === "string" &&
              typeof (item as PdfAttachment).data === "string" &&
              (item as PdfAttachment).data.startsWith("data:"),
          ),
      )
      .slice(0, MAX_PDFS)
      .map((item) => ({
        name: item.name.replace(/[^\w.\- ()]+/g, "").slice(0, 80) || "document.pdf",
        data: item.data,
      }));
  } catch {
    return [];
  }
}

export function encodePdfs(list: PdfAttachment[]) {
  return JSON.stringify(
    list.slice(0, MAX_PDFS).map((item) => ({
      name: item.name.slice(0, 80),
      data: item.data,
    })),
  );
}

export function applyPdfs(meta: Record<string, string>, pdfs: PdfAttachment[]) {
  const next = { ...meta };
  if (!pdfs.length) delete next[PDF_META_KEY];
  else next[PDF_META_KEY] = encodePdfs(pdfs);
  return next;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that PDF."));
    };
    reader.onerror = () => reject(new Error("Could not read that PDF."));
    reader.readAsDataURL(file);
  });
}

export async function readPdfFile(file: File): Promise<PdfAttachment> {
  if (!isPdfFile(file)) throw new Error("Choose a PDF file.");
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("Each PDF needs to be under 2 MB.");
  }
  const data = await readAsDataUrl(file);
  if (!data.startsWith("data:")) throw new Error("Could not read that PDF.");
  const base = file.name.replace(/\.pdf$/i, "").trim() || "document";
  return { name: `${base.slice(0, 72)}.pdf`, data };
}

export function pdfHref(item: PdfAttachment) {
  return item.data;
}

function dataUrlBytes(data: string) {
  const comma = data.indexOf(",");
  if (comma < 0) throw new Error("That PDF is damaged or unreadable.");
  const header = data.slice(0, comma);
  const payload = data.slice(comma + 1);
  if (!/;base64/i.test(header)) throw new Error("That PDF is not stored in a supported format.");
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToPdfDataUrl(bytes: Uint8Array) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

export async function extractPdfText(item: PdfAttachment) {
  if (typeof window === "undefined") {
    throw new Error("PDF text extraction is available only in the browser.");
  }
  // Load PDF.js and its worker on user interaction, never while Vercel imports SSR routes.
  const [{ GlobalWorkerOptions, getDocument }, { default: pdfWorkerUrl }] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const bytes = dataUrlBytes(item.data);
  const task = getDocument({ data: bytes });
  const document = await task.promise;
  const pages: string[] = [];
  try {
    for (let pageNo = 1; pageNo <= document.numPages; pageNo += 1) {
      const page = await document.getPage(pageNo);
      const content = await page.getTextContent();
      const line = content.items
        .map((entry) => ("str" in entry && typeof entry.str === "string" ? entry.str : ""))
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) pages.push(line);
      if (pages.join("\n\n").length >= MAX_EXTRACTED_PDF_TEXT) break;
    }
  } finally {
    await document.destroy();
  }
  const text = pages.join("\n\n").slice(0, MAX_EXTRACTED_PDF_TEXT).trim();
  if (!text) {
    throw new Error("No selectable text was found in this PDF. Scanned/image-only PDFs need OCR before text can be added to Notes.");
  }
  return text;
}

function safePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E\n]/g, "?")
    .replace(/\r/g, "")
    .trim();
}

function wrapText(value: string, max = 88) {
  const lines: string[] = [];
  for (const paragraph of value.split(/\n+/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    if (paragraph.trim() === "") lines.push("");
  }
  return lines;
}

/**
 * Performs a real PDF edit by appending a new page containing user-entered text.
 * This intentionally avoids destructive replacement of existing page content.
 */
export async function appendTextPageToPdf(item: PdfAttachment, text: string): Promise<PdfAttachment> {
  const clean = safePdfText(text);
  if (!clean) throw new Error("Enter some text to add to the PDF.");
  const pdf = await PDFDocument.load(dataUrlBytes(item.data), { ignoreEncryption: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  page.drawText("Sanctum PDF edit", {
    x: 42,
    y: height - 52,
    size: 15,
    font: bold,
    color: rgb(0.12, 0.12, 0.12),
  });
  let y = height - 82;
  for (const line of wrapText(clean)) {
    if (y < 42) break;
    page.drawText(line || " ", {
      x: 42,
      y,
      size: 10.5,
      font,
      maxWidth: width - 84,
      color: rgb(0.12, 0.12, 0.12),
    });
    y -= 14;
  }
  const out = await pdf.save();
  if (out.length > MAX_PDF_BYTES) {
    throw new Error("The edited PDF is over 2 MB. Shorten the edit or use a smaller PDF.");
  }
  return { name: item.name, data: bytesToPdfDataUrl(out) };
}
