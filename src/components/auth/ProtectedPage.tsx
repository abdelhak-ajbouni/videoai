import { ReactNode } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { Loading } from "@/components/ui/loading";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface ProtectedPageProps {
  children: ReactNode;
  loadingText?: string;
  redirectTo?: string;
}

export function ProtectedPage({ 
  children, 
  loadingText = "Loading...", 
  redirectTo = "/" 
}: ProtectedPageProps) {
  const { isLoading, isAuthenticated } = useAuthRedirect(redirectTo);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text={loadingText} />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Redirecting..." />
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}