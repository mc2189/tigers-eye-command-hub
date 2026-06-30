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
import { weekDays } from "@/lib/demo-data";
import type { MappedBooking, MappedCalendarItem, DataSource } from "@/lib/cliniko-mappers";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";
import type { ClinikoStatusData } from "./ClinikoConnectionPanel";

interface CommandHubAppointmentsContextValue {
  mapped: MappedBooking[];
  calendarItems: MappedCalendarItem[];
  source: DataSource;
  loading: boolean;
  lastChecked: string | null;
  error: string | null;
  connected: boolean;
  isLive: boolean;
  reload: () => Promise<void>;
  loadToday: () => Promise<void>;
  loadRange: (from: string, to: string) => Promise<void>;
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

  const isLive = useMemo(
    () =>
      connected &&
      (cliniko.source === "cliniko-test" || cliniko.source === "cliniko") &&
      cliniko.mapped.length > 0,
    [connected, cliniko.source, cliniko.mapped.length]
  );

  const loadCurrentWeek = useCallback(async () => {
    const from = weekDays[0];
    const to = weekDays[weekDays.length - 1];
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

        if (json.status === "connected" && json.source === "cliniko") {
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
      isLive,
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
      initialized,
      isLive,
      loadCurrentWeek,
    ]
  );

  return (
    <CommandHubAppointmentsContext.Provider value={value}>
      {children}
    </CommandHubAppointmentsContext.Provider>
  );
}
