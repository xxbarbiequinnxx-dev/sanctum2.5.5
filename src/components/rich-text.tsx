import { useEffect, type MouseEvent, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Italic, List, ListChecks, Underline as UnderlineIcon } from "lucide-react";
import { Select } from "@/components/ui/select";
import { looksLikeHtml, sanitizeRichHtml, toEditorHtml, toggleChecklistAt } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export const WRITE_FONTS = [
  { label: "Sans", value: "Outfit, ui-sans-serif, sans-serif" },
  { label: "Display", value: '"Cormorant Garamond", Georgia, serif' },
  { label: "Literata", value: "Literata, Georgia, serif" },
  { label: "Source Serif", value: '"Source Serif 4", Georgia, serif' },
  { label: "Plex", value: '"IBM Plex Sans", ui-sans-serif, sans-serif' },
] as const;

export const WRITE_SIZES = [
  { label: "Small", value: "0.85em" },
  { label: "Body", value: "" },
  { label: "Large", value: "1.25em" },
  { label: "Title", value: "1.55em" },
] as const;

function extensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      code: false,
    }),
    TextStyle,
    FontFamily,
    FontSize,
    Underline,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: placeholder || "Write…" }),
  ];
}

export function RichEditor({
  value,
  onChange,
  placeholder,
  compact = false,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: extensions(placeholder),
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: cn("rich-text min-h-28 px-3 py-2.5 text-sm outline-none", compact && "min-h-20"),
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.isEmpty ? "" : instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const next = toEditorHtml(value);
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (next === current) return;
    editor.commands.setContent(next || "", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-28 rounded-lg border border-input bg-secondary" />;
  }

  const font = String(editor.getAttributes("textStyle").fontFamily ?? "");
  const size = String(editor.getAttributes("textStyle").fontSize ?? "");

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-secondary focus-within:ring-2 focus-within:ring-ring/60">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <Select
          value={font}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(next).run();
          }}
          className="h-9 w-[7.8rem] min-w-0 px-2 pr-8 text-xs"
          aria-label="Font"
        >
          <option value="">Font</option>
          {WRITE_FONTS.map((item) => (
            <option key={item.label} value={item.value} style={{ fontFamily: item.value }}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          value={size}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) editor.chain().focus().unsetFontSize().run();
            else editor.chain().focus().setFontSize(next).run();
          }}
          className="h-9 w-[5.6rem] min-w-0 px-2 pr-8 text-xs"
          aria-label="Size"
        >
          {WRITE_SIZES.map((item) => (
            <option key={item.label} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <MarkButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </MarkButton>
        <MarkButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </MarkButton>
        <MarkButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </MarkButton>
        <MarkButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </MarkButton>
        <MarkButton
          label="Checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="size-4" />
        </MarkButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function MarkButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-raised hover:text-foreground",
        active && "bg-primary/15 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function RichText({
  html,
  className,
  clamp,
  onChange,
}: {
  html: string;
  className?: string;
  clamp?: boolean;
  onChange?: (html: string) => void;
}) {
  if (!html) return null;
  if (!looksLikeHtml(html)) {
    return (
      <p className={cn("whitespace-pre-wrap text-sm text-muted-foreground", clamp && "line-clamp-4", className)}>
        {html}
      </p>
    );
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!onChange) return;
    const target = event.target as HTMLElement | null;
    const input = target?.closest("input[type='checkbox']") as HTMLInputElement | null;
    if (!input) return;
    event.preventDefault();
    const root = event.currentTarget;
    const boxes = Array.from(root.querySelectorAll("input[type='checkbox']"));
    const index = boxes.indexOf(input);
    if (index < 0) return;
    onChange(toggleChecklistAt(html, index));
  }

  return (
    <div
      className={cn(
        "rich-text text-sm text-muted-foreground",
        clamp && "line-clamp-4",
        onChange && "rich-text-live",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
      onClick={onChange ? handleClick : undefined}
    />
  );
}
