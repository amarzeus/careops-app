import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  
  if (!user) redirect("/login");
  if (user.workspace?.status === "ONBOARDING") redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userName={user.name}
        userRole={user.role}
        workspaceName={user.workspace?.name}
      />
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
