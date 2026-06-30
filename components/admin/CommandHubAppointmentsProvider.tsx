"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MappedBooking, MappedCalendarItem, DataSource } from "@/lib/cliniko-mappers";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";
import type { ClinikoStatusData } from "./ClinikoConnectionPanel";

/** Load window for daily workflow — wider than Mon–Fri demo week. */
function workflowLoadRange(): { from: string; to: string } {
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const to = new Date();
  to.setDate(to.getDate() + 90);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

interface CommandHubAppointmentsContextValue {
  mapped: MappedBooking[];
  calendarItems: MappedCalendarItem[];
  source: DataSource;
  loading: boolean;
  lastChecked: string | null;
  error: string | null;
  connected: boolean;
  configured: boolean;
  isLive: boolean;
  reload: () => Promise<void>;
  loadToday: () => Promise<void>;
  loadRange: (from: string, to: string) => Promise<void>;
  hasLiveAppointments: boolean;
  clinikoStatus: ClinikoStatusData | null;
}

const CommandHubAppointmentsContext =
  createContext<CommandHubAppointmentsContextValue | null>(null);

export function useCommandHubAppointments(): CommandHubAppointmentsContextValue {
  const value = useContext(CommandHubAppointmentsContext);
  if (!value) {
    throw new Error(
      "useCommandHubAppointments must be used within CommandHubAppointmentsProvider"
    );
  }
  return value;
}

export function CommandHubAppointmentsProvider({ children }: { children: ReactNode }) {
  const {
    mapped,
    calendarItems,
    source,
    loading: appointmentsLoading,
    lastChecked,
    error,
    load,
    loadToday,
  } = useMappedClinikoBookings();
  const [status, setStatus] = useState<ClinikoStatusData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const connected = Boolean(
    status?.status === "connected" && status.source === "cliniko"
  );

  const configured = Boolean(status?.configured);

  const isLive = useMemo(
    () =>
      configured &&
      initialized &&
      !error &&
      (source === "cliniko-test" || source === "cliniko"),
    [configured, error, initialized, source]
  );

  const hasLiveAppointments = isLive && mapped.length > 0;

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/cliniko/status", { cache: "no-store" });
      const json = (await res.json()) as ClinikoStatusData;
      setStatus(json);
      return json;
    } catch {
      setStatus(null);
      return null;
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadCurrentWeek = useCallback(async () => {
    const { from, to } = workflowLoadRange();
    await load({ from, to });
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const json = await refreshStatus();
      if (cancelled) return;
      setInitialized(true);
      if (json?.configured) {
        void loadCurrentWeek();
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentWeek, refreshStatus]);

  const value = useMemo<CommandHubAppointmentsContextValue>(
    () => ({
      mapped,
      calendarItems,
      source,
      loading: appointmentsLoading || statusLoading || !initialized,
      lastChecked,
      error,
      connected,
      configured,
      isLive,
      hasLiveAppointments,
      clinikoStatus: status,
      reload: async () => {
        const json = await refreshStatus();
        if (json?.configured) {
          await loadCurrentWeek();
        }
      },
      loadToday: async () => {
        await loadToday();
      },
      loadRange: async (from, to) => {
        await load({ from, to });
      },
    }),
    [
      mapped,
      calendarItems,
      source,
      appointmentsLoading,
      statusLoading,
      initialized,
      lastChecked,
      error,
      connected,
      configured,
      isLive,
      hasLiveAppointments,
      status,
      refreshStatus,
      loadCurrentWeek,
      loadToday,
      load,
    ]
  );

  return (
    <CommandHubAppointmentsContext.Provider value={value}>
      {children}
    </CommandHubAppointmentsContext.Provider>
  );
}
