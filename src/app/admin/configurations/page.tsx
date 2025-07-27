import { ConfigurationManager } from "@/components/ConfigurationManager";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ConfigurationsPage() {
  const user = await currentUser();
  const userId = user?.id;

  // Basic admin check - in production, you'd want more sophisticated role-based access control
  if (!userId) {
    redirect("/sign-in");
  }

  // For now, allow access to any authenticated user
  // In production, you'd check against an admin role or specific user IDs
  const isAdmin = true; // Replace with actual admin check

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <ConfigurationManager />
      </div>
    </DashboardLayout>
  );
} 