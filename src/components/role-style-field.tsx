import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Role } from "@/lib/kinds";
import { isKnownStyle, styleFieldLabel, stylesFor } from "@/lib/role-styles";

export function RoleStyleField({
  role,
  value,
  onChange,
}: {
  role: Role;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = stylesFor(role);
  const known = isKnownStyle(role, value);
  const selectValue = known ? value : value ? "other" : "";
  const custom = known ? "" : value === "other" ? "" : value;

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <Label>{styleFieldLabel(role)}</Label>
        <Select
          value={selectValue}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "other") onChange(custom || "other");
            else onChange(next);
          }}
        >
          <option value="">Choose…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </label>
      {selectValue === "other" ? (
        <label className="block space-y-1.5">
          <Label>Your type</Label>
          <Input
            value={custom === "other" ? "" : custom}
            onChange={(event) => onChange(event.target.value.trim() ? event.target.value : "other")}
            placeholder={role === "dominant" ? "e.g. Brat tamer, FinDom…" : "e.g. Switchy brat…"}
            maxLength={80}
          />
        </label>
      ) : null}
    </div>
  );
}
