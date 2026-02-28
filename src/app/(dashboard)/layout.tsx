import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { DashboardErrorBoundary } from "@/components/common";
import { DashboardCopilot } from "@/components/dashboard/copilot";

/**
 * Dashboard Layout
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  if (!user) redirect("/login");
  if (user.workspace?.status === "ONBOARDING") redirect("/onboarding");

  // ROLE-BASED ACCESS CONTROL (RBAC)
  if (
    user.role !== "OWNER" &&
    (pathname.startsWith("/settings") || pathname.startsWith("/automation"))
  ) {
    redirect("/dashboard");
  }

  // Pages that use full-screen layouts (no footer needed)
  const fullScreenPages = ["/inbox", "/bookings", "/voice/calls"];
  const showFooter = !fullScreenPages.some((page) => pathname.startsWith(page));

  return (
    <div className="bg-background flex min-h-screen">
      <Sidebar userName={user.name} userRole={user.role} workspaceName={user.workspace?.name} />

      <div className="flex min-h-screen flex-1 flex-col pl-16 lg:pl-64">
        <main className="flex-1 overflow-y-auto">
          <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
        </main>
        {showFooter && <Footer />}

        {/* Global Dashboard AI Co-pilot */}
        <DashboardCopilot />
      </div>
    </div>
  );
}
