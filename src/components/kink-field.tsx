import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALL_KINK_OPTIONS,
  kinksFor,
  matchKnownTag,
  MAX_KINK_LABEL,
  MAX_PROFILE_KINKS,
  tagLabel,
  type TagOption,
} from "@/lib/kinks";
import type { Role } from "@/lib/kinds";
import { cn } from "@/lib/utils";

export function TagPickField({
  label,
  hint = "Pick as many as you want. Add ones that are not on the list.",
  catalog,
  value,
  onChange,
  addPlaceholder = "Add one",
}: {
  label: string;
  hint?: string;
  catalog: readonly TagOption[];
  value: string[];
  onChange: (next: string[]) => void;
  addPlaceholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const known = new Set(catalog.map((item) => item.value));
  const room = Math.max(0, MAX_PROFILE_KINKS - value.length);

  function toggle(slug: string) {
    if (value.includes(slug)) onChange(value.filter((item) => item !== slug));
    else if (room > 0) onChange([...value, slug]);
  }

  function addCustom() {
    const next = matchKnownTag(draft, catalog);
    setDraft("");
    if (!next) return;
    if (value.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    if (room <= 0) return;
    onChange([...value, next]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{value.length} chosen</p>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value.length ? (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Chosen — tap × to remove</p>
          <div className="flex flex-wrap gap-1.5">
            {value.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed
                onClick={() => toggle(item)}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs text-primary-foreground"
              >
                {tagLabel(item, catalog)}
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {catalog.map((item) => {
          const on = value.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item.value)}
              className={cn(
                "h-9 rounded-full px-3 text-xs",
                on ? "bg-primary/20 text-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addCustom();
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, MAX_KINK_LABEL))}
          placeholder={addPlaceholder}
          maxLength={MAX_KINK_LABEL}
          disabled={room <= 0}
        />
        <Button type="submit" variant="outline" className="shrink-0" disabled={room <= 0 || !draft.trim()}>
          <Plus />
          Add
        </Button>
      </form>
    </div>
  );
}

export function KinkField({
  role,
  value,
  onChange,
}: {
  role: Role | string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <TagPickField
      label="Kinks"
      hint="These follow your role. Pick as many as you want. Add your own. Remove any from Chosen."
      catalog={kinksFor(role)}
      value={value}
      onChange={onChange}
      addPlaceholder="Add a kink"
    />
  );
}

export function KinkList({ values, role }: { values: string[]; role?: Role | string }) {
  if (!values.length) return null;
  const catalog = role ? kinksFor(role) : ALL_KINK_OPTIONS;
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Kinks</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((item) => (
          <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
            {tagLabel(item, catalog)}
          </span>
        ))}
      </div>
    </div>
  );
}
