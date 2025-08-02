import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function useAuthRedirect(redirectTo: string = "/") {
  const { isLoaded, isSignedIn } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    // Only redirect once everything is loaded and we're sure user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.push(redirectTo);
    }
  }, [isLoaded, isSignedIn, router, redirectTo]);

  return {
    isLoading: !isLoaded || (isSignedIn && currentUser === undefined),
    isAuthenticated: isLoaded && isSignedIn && currentUser !== null,
    currentUser,
  };
}