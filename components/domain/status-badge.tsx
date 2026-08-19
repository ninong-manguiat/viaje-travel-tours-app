import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const good = ["paid", "approved", "accepted", "converted", "confirmed", "completed", "published", "active"];
const pending = ["submitted", "for_verification", "partially_paid", "under_review", "sent", "viewed", "reserved", "awaiting_payment", "processing", "limited", "pending"];
const danger = ["unpaid", "rejected", "refunded", "needs_replacement", "required", "expired", "cancelled", "sold_out"];

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.toLowerCase();
  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full border-0 px-3 py-1.5 text-[11.5px] font-bold capitalize tracking-[0.02em] before:h-1.5 before:w-1.5 before:rounded-full before:content-['']",
        good.includes(normalized) && "bg-[#E7F2EB] text-viaje-green before:bg-viaje-green",
        pending.includes(normalized) && "bg-[#FBF0DE] text-viaje-amber before:bg-viaje-amber",
        danger.includes(normalized) && "bg-[#FBEAE8] text-viaje-red before:bg-viaje-red",
        !good.includes(normalized) && !pending.includes(normalized) && !danger.includes(normalized) && "bg-[#EAEEF2] text-viaje-soft before:bg-viaje-soft",
        className
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
