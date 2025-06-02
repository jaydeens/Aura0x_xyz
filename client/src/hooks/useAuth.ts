import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache at all (replaces cacheTime in v5)
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable to prevent loops
    refetchInterval: false, // Disable automatic polling
  });

  // If we got a 401 error, consider loading complete and user unauthenticated
  const isActuallyLoading = isLoading && !error;

  return {
    user,
    isLoading: isActuallyLoading,
    isAuthenticated: !!user && !error,
  };
}
