import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

/**
 *
 * @param root0
 * @param root0.children
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  if (!user) redirect("/login");
  if (user.workspace?.status === "ONBOARDING") redirect("/onboarding");

  // ROLE-BASED ACCESS CONTROL (RBAC)
  // Staff cannot access Settings or Automation pages
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Sidebar userName={user.name} userRole={user.role} workspaceName={user.workspace?.name} />
      <main className="ml-16 flex min-h-screen flex-1 flex-col p-4 lg:ml-64 lg:p-8">
        {children}
      </main>
      {showFooter && (
        <div className="ml-16 lg:ml-64">
          <Footer />
        </div>
      )}
    </div>
  );
}
