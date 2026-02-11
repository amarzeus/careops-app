import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch verified workspace name
    let workspaceName = "My Workspace";
    if (session.user.workspaceId) {
        const ws = await prisma.workspace.findUnique({
            where: { id: session.user.workspaceId },
            select: { name: true }
        });
        if (ws) workspaceName = ws.name;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                userName={session.user.name || "User"}
                userRole={session.user.role || "OWNER"}
                workspaceName={workspaceName}
            />
            <main className="flex-1 overflow-y-auto lg:ml-64 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
