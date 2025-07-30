import { useState, useEffect } from "react";

// Global state to prevent multiple API calls
let globalAuthState = {
  user: null,
  isLoading: true,
  hasChecked: false,
  listeners: new Set<Function>(),
};

let authPromise: Promise<any> | null = null;

function notifyListeners() {
  globalAuthState.listeners.forEach(listener => listener());
}

function fetchUserAuth() {
  if (authPromise) return authPromise;
  
  authPromise = fetch("/api/auth/user")
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Unauthorized');
    })
    .then(userData => {
      globalAuthState.user = userData;
      globalAuthState.isLoading = false;
      globalAuthState.hasChecked = true;
      notifyListeners();
      return userData;
    })
    .catch(() => {
      globalAuthState.user = null;
      globalAuthState.isLoading = false;
      globalAuthState.hasChecked = true;
      notifyListeners();
      return null;
    })
    .finally(() => {
      authPromise = null;
    });
    
  return authPromise;
}

async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      globalAuthState.user = null;
      globalAuthState.isLoading = false;
      globalAuthState.hasChecked = true;
      notifyListeners();
      window.location.href = "/";
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function useAuth() {
  const [state, setState] = useState(() => ({
    user: globalAuthState.user,
    isLoading: globalAuthState.isLoading,
    isAuthenticated: !!globalAuthState.user,
  }));

  useEffect(() => {
    const updateState = () => {
      setState({
        user: globalAuthState.user,
        isLoading: globalAuthState.isLoading,
        isAuthenticated: !!globalAuthState.user,
      });
    };

    // Add listener
    globalAuthState.listeners.add(updateState);

    // Check auth if not already checked
    if (!globalAuthState.hasChecked && !authPromise) {
      fetchUserAuth();
    }

    // Cleanup listener on unmount
    return () => {
      globalAuthState.listeners.delete(updateState);
    };
  }, []);

  return {
    ...state,
    logout
  };
}
