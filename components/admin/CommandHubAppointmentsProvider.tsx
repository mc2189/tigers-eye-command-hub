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
import { mapDemoClinicWeekToBookings, mapDemoClinicWeekToCalendarItems } from "@/lib/demo-week-to-mapped";
import { isDemoWeekPreviewActive, DEMO_WEEK_PREVIEW_KEY } from "@/lib/demo-week-preview";
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
  demoWeekPreview: boolean;
  reload: () => Promise<void>;
  loadToday: () => Promise<void>;
  loadRange: (from: string, to: string) => Promise<void>;
  hasLiveAppointments: boolean;
  hasDisplayQualityIssues: boolean;
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
    hasDisplayQualityIssues,
  } = useMappedClinikoBookings();
  const [status, setStatus] = useState<ClinikoStatusData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [demoWeekPreview, setDemoWeekPreview] = useState(true);

  useEffect(() => {
    setDemoWeekPreview(isDemoWeekPreviewActive());
    const handler = () => setDemoWeekPreview(isDemoWeekPreviewActive());
    window.addEventListener("demo-week-preview-changed", handler);
    return () => window.removeEventListener("demo-week-preview-changed", handler);
  }, []);

  // Default demo week preview on for rich demo layout unless user opted out
  useEffect(() => {
    if (!initialized) return;
    if (localStorage.getItem(DEMO_WEEK_PREVIEW_KEY) === "inactive") return;
    if (mapped.length > 0 && mapped.length >= 8) return;
    setDemoWeekPreview(true);
  }, [initialized, mapped.length]);

  const demoWeekMapped = useMemo(() => mapDemoClinicWeekToBookings("demo"), []);
  const demoWeekCalendar = useMemo(() => mapDemoClinicWeekToCalendarItems(), []);

  const effectiveMapped = useMemo(() => {
    if (demoWeekPreview) return demoWeekMapped;
    return mapped;
  }, [demoWeekPreview, demoWeekMapped, mapped]);

  const effectiveCalendar = useMemo(() => {
    if (demoWeekPreview) return demoWeekCalendar;
    return calendarItems;
  }, [demoWeekPreview, demoWeekCalendar, calendarItems]);

  const effectiveSource: DataSource = demoWeekPreview ? "demo" : source;

  const connected = Boolean(
    status?.status === "connected" && status.source === "cliniko"
  );

  const configured = Boolean(status?.configured);

  const isLive = useMemo(
    () =>
      !demoWeekPreview &&
      configured &&
      initialized &&
      !error &&
      (source === "cliniko-test" || source === "cliniko"),
    [configured, demoWeekPreview, error, initialized, source]
  );

  const hasLiveAppointments = isLive && effectiveMapped.length > 0;

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
      mapped: effectiveMapped,
      calendarItems: effectiveCalendar,
      source: effectiveSource,
      loading: appointmentsLoading || statusLoading || !initialized,
      lastChecked,
      error,
      connected,
      configured,
      isLive,
      demoWeekPreview,
      hasLiveAppointments,
      hasDisplayQualityIssues: demoWeekPreview ? false : hasDisplayQualityIssues,
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
      effectiveMapped,
      effectiveCalendar,
      effectiveSource,
      appointmentsLoading,
      statusLoading,
      initialized,
      lastChecked,
      error,
      connected,
      configured,
      isLive,
      demoWeekPreview,
      hasLiveAppointments,
      hasDisplayQualityIssues,
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
