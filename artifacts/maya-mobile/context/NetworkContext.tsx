import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);

  const checkConnectivity = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const reachable = await pingServer();
      if (reachable) {
        setIsOffline(false);
      }
    } finally {
      checkingRef.current = false;
    }
  }, []);

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
      setIsOffline(true);
    });
    return () => {
      setNetworkErrorHandler(() => {});
    };
  }, []);

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
