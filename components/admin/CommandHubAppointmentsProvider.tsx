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
  const cliniko = useMappedClinikoBookings();
  const [status, setStatus] = useState<ClinikoStatusData | null>(null);
  const [initialized, setInitialized] = useState(false);

  const connected = Boolean(
    status?.status === "connected" && status.source === "cliniko"
  );

  const configured = Boolean(status?.configured);

  const isLive = useMemo(
    () =>
      connected &&
      initialized &&
      !cliniko.error &&
      (cliniko.source === "cliniko-test" || cliniko.source === "cliniko"),
    [connected, cliniko.source, cliniko.error, initialized]
  );

  const hasLiveAppointments = isLive && cliniko.mapped.length > 0;

  const loadCurrentWeek = useCallback(async () => {
    const { from, to } = workflowLoadRange();
    await cliniko.load({ from, to });
  }, [cliniko]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await fetch("/api/cliniko/status", { cache: "no-store" });
        const json = (await res.json()) as ClinikoStatusData;
        if (cancelled) return;
        setStatus(json);

        if (json.configured) {
          await loadCurrentWeek();
        }
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentWeek]);

  const value = useMemo<CommandHubAppointmentsContextValue>(
    () => ({
      mapped: cliniko.mapped,
      calendarItems: cliniko.calendarItems,
      source: cliniko.source,
      loading: cliniko.loading || !initialized,
      lastChecked: cliniko.lastChecked,
      error: cliniko.error,
      connected,
      configured,
      isLive,
      hasLiveAppointments,
      clinikoStatus: status,
      reload: async () => {
        await loadCurrentWeek();
      },
      loadToday: async () => {
        await cliniko.loadToday();
      },
      loadRange: async (from, to) => {
        await cliniko.load({ from, to });
      },
    }),
    [
      cliniko,
      connected,
      configured,
      initialized,
      isLive,
      hasLiveAppointments,
      status,
      loadCurrentWeek,
    ]
  );

  return (
    <CommandHubAppointmentsContext.Provider value={value}>
      {children}
    </CommandHubAppointmentsContext.Provider>
  );
}
