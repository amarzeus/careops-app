import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  if (!user) redirect("/login");
  if (user.workspace?.status === "ONBOARDING") redirect("/onboarding");

  // ROLE-BASED ACCESS CONTROL (RBAC)
  // Staff cannot access Settings or Automation pages
  if (user.role !== "OWNER" && (pathname.startsWith("/settings") || pathname.startsWith("/automation"))) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userName={user.name}
        userRole={user.role}
        workspaceName={user.workspace?.name}
      />
      <main className="lg:ml-64 ml-16 min-h-screen p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
