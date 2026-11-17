import { LABEL_STATUS_BOOKING } from "@/lib/status";
import type { StatusBooking } from "@/lib/enums";

const WARNA: Record<StatusBooking, string> = {
  BOOKED: "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800",
  WAITING_FOR_PAYMENT: "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  DIBATALKAN: "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};

export function StatusBadge({ status }: { status: StatusBooking }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${WARNA[status]}`}>
      {LABEL_STATUS_BOOKING[status]}
    </span>
  );
}
