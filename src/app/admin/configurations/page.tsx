import { ConfigurationManager } from "@/components/ConfigurationManager";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function ConfigurationsPage() {
  const { userId } = await auth();

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
    <div className="container mx-auto py-8 px-4">
      <ConfigurationManager />
    </div>
  );
} 