import { FilePenLine, FileText, NotebookPen, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PDF_ACCEPT, hasNativePicker, pickNative } from "@/lib/media-access";
import {
  appendTextPageToPdf,
  extractPdfText,
  isPdfFile,
  MAX_PDFS,
  readPdfFile,
} from "@/lib/pdf";
import type { PdfAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PdfField({
  pdfs,
  onChange,
  onInsertText,
  max = MAX_PDFS,
  label = "PDFs",
}: {
  pdfs: PdfAttachment[];
  onChange: (next: PdfAttachment[]) => void;
  onInsertText?: (name: string, text: string) => void;
  max?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [workingIndex, setWorkingIndex] = useState<number | null>(null);

  async function addFiles(files: File[]) {
    if (!files.length) return;
    const room = max - pdfs.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${max} PDFs.`);
      return;
    }
    setBusy(true);
    try {
      const next = [...pdfs];
      for (const file of files.slice(0, room)) {
        if (!isPdfFile(file)) {
          toast.error(`${file.name} is not a PDF.`);
          continue;
        }
        next.push(await readPdfFile(file));
      }
      onChange(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    await addFiles(files);
  }

  async function openNativePdf() {
    if (busy) return;
    const picked = await pickNative("pdf", max - pdfs.length > 1);
    if (picked === "cancelled") return;
    await addFiles(picked);
  }

  async function addPdfTextToNotes(item: PdfAttachment, index: number) {
    if (!onInsertText || workingIndex != null) return;
    setWorkingIndex(index);
    try {
      const text = await extractPdfText(item);
      onInsertText(item.name, text);
      toast.success(`Added text from ${item.name} to Notes.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not extract text from that PDF.");
    } finally {
      setWorkingIndex(null);
    }
  }

  async function editPdf(item: PdfAttachment, index: number) {
    if (workingIndex != null) return;
    const text = window.prompt(
      `Add an editable notes page to ${item.name}.\n\nEnter the text you want written into the PDF:`,
      "",
    );
    if (text == null) return;
    setWorkingIndex(index);
    try {
      const edited = await appendTextPageToPdf(item, text);
      onChange(pdfs.map((pdf, i) => (i === index ? edited : pdf)));
      toast.success(`${item.name} was updated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not edit that PDF.");
    } finally {
      setWorkingIndex(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {pdfs.length}/{max}
        </p>
      </div>
      {pdfs.length ? (
        <ul className="space-y-1.5">
          {pdfs.map((item, index) => (
            <li key={`${item.name}-${index}`} className="rounded-md bg-secondary px-2 py-2">
              <div className="flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <button type="button" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-foreground" onClick={() => onChange(pdfs.filter((_, i) => i !== index))} aria-label={`Remove ${item.name}`}>
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                {onInsertText ? (
                  <Button type="button" size="sm" variant="outline" disabled={workingIndex != null} onClick={() => void addPdfTextToNotes(item, index)}>
                    <NotebookPen className="size-3.5" />
                    {workingIndex === index ? "Reading…" : "Add text to Notes"}
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="outline" disabled={workingIndex != null} onClick={() => void editPdf(item, index)}>
                  <FilePenLine className="size-3.5" />
                  Edit PDF
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {pdfs.length < max ? (
        <>
          <label className={cn("relative flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed border-input text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground", busy && "pointer-events-none opacity-60")}>
            <FileText className="size-4" />
            {busy ? "Adding…" : "Add PDF"}
            <input ref={inputRef} type="file" accept={PDF_ACCEPT} multiple={max - pdfs.length > 1} disabled={busy} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onClick={(event) => { if (!hasNativePicker()) return; event.preventDefault(); void openNativePdf(); }} onChange={(event) => void onPick(event)} aria-label="Add PDF" />
          </label>
          <p className="text-xs text-muted-foreground">Opens Files only. Up to {max} PDFs, 2 MB each. Attached PDFs can be read into Notes or edited by appending a text page.</p>
        </>
      ) : null}
    </div>
  );
}

export function PdfStrip({ pdfs, className }: { pdfs: PdfAttachment[]; className?: string; }) {
  if (!pdfs.length) return null;
  return (
    <ul className={cn("space-y-1", className)}>
      {pdfs.map((item, index) => (
        <li key={`${item.name}-${index}`}>
          <a href={item.data} download={item.name} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-md bg-secondary px-2 text-sm text-foreground hover:bg-raised">
            <FileText className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 truncate">{item.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PdfOpenButton({ item }: { item: PdfAttachment }) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={item.data} download={item.name} target="_blank" rel="noreferrer">
        <FileText className="size-4" />
        {item.name}
      </a>
    </Button>
  );
}
