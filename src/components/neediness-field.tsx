import { Label } from "@/components/ui/label";
import { COMPANION_NEEDINESS, clampCompanionNeediness } from "@/lib/companion";
import { cn } from "@/lib/utils";

export function NeedinessField({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const level = clampCompanionNeediness(value);
  const current = COMPANION_NEEDINESS[level - 1];
  return (
    <div className="space-y-2">
      <Label>Neediness</Label>
      <p className="text-xs text-muted-foreground">How often they write to you first.</p>
      <div className="grid grid-cols-5 gap-1">
        {COMPANION_NEEDINESS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "h-11 rounded-lg text-[11px]",
              level === item.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{current.hint}</p>
    </div>
  );
}
