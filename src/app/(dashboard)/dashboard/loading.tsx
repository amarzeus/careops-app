import { DashboardSkeleton } from "@/components/ui/skeletons";

/**
 * Next.js loading boundary for the dashboard page.
 * Shows shimmer skeletons while the dashboard data is loading.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
