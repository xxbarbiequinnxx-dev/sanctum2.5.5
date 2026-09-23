import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-180.png"
      alt=""
      className={cn("shrink-0 rounded-[22%] object-cover", className)}
    />
  );
}
