/* eslint-disable react-refresh/only-export-components -- Provider hooks share one private context. */
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { AdminRuntime, AdminRuntimeSnapshot } from "./adminRuntime";

const AdminRuntimeContext = createContext<AdminRuntime | null>(null);

export interface AdminRuntimeProviderProps {
  readonly children: ReactNode;
  readonly runtime: AdminRuntime;
}

export function AdminRuntimeProvider({ children, runtime }: AdminRuntimeProviderProps) {
  useEffect(() => {
    void runtime.initialize();
    return () => {
      void runtime.dispose();
    };
  }, [runtime]);

  return <AdminRuntimeContext.Provider value={runtime}>{children}</AdminRuntimeContext.Provider>;
}

export function useAdminRuntime(): AdminRuntime {
  const runtime = useContext(AdminRuntimeContext);
  if (!runtime) throw new Error("useAdminRuntime must be used within AdminRuntimeProvider.");
  return runtime;
}

export function useAdminRuntimeSnapshot(): AdminRuntimeSnapshot {
  const runtime = useAdminRuntime();
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
}
