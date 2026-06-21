import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly on navigation (inside the persistent sidebar shell) while the
// destination page renders on the server. Makes clicks feel immediate.
export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72 max-w-[60vw]" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
