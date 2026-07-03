import type { QueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { pingServer, setNetworkErrorHandler } from "@/lib/api";

interface NetworkContextValue {
  isOffline: boolean;
  retry: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  isOffline: false,
  retry: () => {},
});

const RETRY_INTERVAL_MS = 5000;

export function NetworkProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);
  const wasOfflineRef = useRef(false);
  const { refresh: refreshAuth, initialCheckDoneRef } = useAuth();

  useEffect(() => {
    wasOfflineRef.current = isOffline;
  }, [isOffline]);

  const checkConnectivity = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const reachable = await pingServer();
      if (reachable) {
        if (wasOfflineRef.current) {
          // Just came back online: refetch everything instead of leaving
          // screens showing stale, pre-outage data, and re-verify the
          // session in case it expired while we were offline.
          queryClient.invalidateQueries();
          refreshAuth();
        }
        setIsOffline(false);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [queryClient, refreshAuth]);

  useEffect(() => {
    if (isOffline) {
      intervalRef.current = setInterval(checkConnectivity, RETRY_INTERVAL_MS);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOffline, checkConnectivity]);

  useEffect(() => {
    setNetworkErrorHandler(() => {
      // Ignore network errors that occur before the initial auth check has
      // completed (e.g. cold start before the API base URL is fully wired
      // up), so we don't flash a false "offline" overlay on app launch.
      if (!initialCheckDoneRef.current) return;
      setIsOffline(true);
    });
    return () => {
      setNetworkErrorHandler(() => {});
    };
  }, [initialCheckDoneRef]);

  const retry = useCallback(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  return (
    <NetworkContext.Provider value={{ isOffline, retry }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
