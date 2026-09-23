import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-md border border-input bg-secondary bg-[length:12px] bg-[right_12px_center] bg-no-repeat px-3 pr-10 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23a89890' stroke-width='1.6' viewBox='0 0 16 16'><path d='m3 6 5 5 5-5'/></svg>\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}
