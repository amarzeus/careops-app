import { TableSkeleton } from "@/components/ui/skeletons";

/**
 * Next.js loading boundary for the contacts page.
 */
export default function ContactsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 space-y-2">
        <div className="bg-muted/50 h-8 w-32 animate-pulse rounded" />
        <div className="bg-muted/50 h-4 w-48 animate-pulse rounded" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
