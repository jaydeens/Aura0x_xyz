import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check auth once when component mounts
    if (!hasChecked) {
      fetch("/api/auth/user")
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Unauthorized');
        })
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
          setHasChecked(true);
        });
    }
  }, [hasChecked]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
