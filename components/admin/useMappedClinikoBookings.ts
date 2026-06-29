"use client";

import { useCallback, useState } from "react";
import {
  mapClinikoIndividualAppointments,
  mapClinikoIndividualAppointmentToCalendarItem,
  type ClinikoAppointmentTypeInput,
  type ClinikoIndividualAppointmentInput,
  type MappedBooking,
  type MappedCalendarItem,
  type DataSource,
} from "@/lib/cliniko-mappers";
import { asArray, safeLowerCase } from "@/lib/safe-data";

interface LoadResult {
  mapped: MappedBooking[];
  calendarItems: MappedCalendarItem[];
  source: DataSource;
  lastChecked: string;
  individualAppointmentCount: number;
}

export function useMappedClinikoBookings() {
  const [mapped, setMapped] = useState<MappedBooking[]>([]);
  const [calendarItems, setCalendarItems] = useState<MappedCalendarItem[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [individualAppointmentCount, setIndividualAppointmentCount] = useState(0);

  const load = useCallback(async (params?: { from?: string; to?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ perPage: "50" });
      if (params?.from) query.set("from", params.from);
      if (params?.to) query.set("to", params.to);

      const [appointmentsRes, typesRes] = await Promise.all([
        fetch(`/api/cliniko/individual-appointments?${query}`, { cache: "no-store" }),
        fetch("/api/cliniko/appointment-types", { cache: "no-store" }),
      ]);

      const appointmentsJson = (await appointmentsRes.json()) as {
        appointments: ClinikoIndividualAppointmentInput[];
        source: DataSource;
      };
      const typesJson = (await typesRes.json()) as {
        appointmentTypes: ClinikoAppointmentTypeInput[];
      };

      const appointments = asArray<ClinikoIndividualAppointmentInput>(appointmentsJson.appointments);
      const appointmentTypes = asArray<ClinikoAppointmentTypeInput>(typesJson.appointmentTypes);

      const mappedBookings = mapClinikoIndividualAppointments(appointments, {
        appointmentTypes,
      });
      const calItems = appointments.map((appointment) =>
        mapClinikoIndividualAppointmentToCalendarItem(appointment, {
          appointmentTypes,
        })
      );

      const resolvedSource =
        appointmentsJson.source === "cliniko" ? "cliniko-test" : appointmentsJson.source ?? "demo";

      setMapped(mappedBookings);
      setCalendarItems(calItems);
      setSource(resolvedSource);
      setIndividualAppointmentCount(appointments.length);
      setLastChecked(new Date().toLocaleString("en-GB"));

      return {
        mapped: mappedBookings,
        calendarItems: calItems,
        source: resolvedSource,
        lastChecked: new Date().toLocaleString("en-GB"),
        individualAppointmentCount: appointments.length,
      } satisfies LoadResult;
    } catch {
      setError("Cliniko could not be reached. Demo data is still available.");
      setMapped([]);
      setCalendarItems([]);
      setIndividualAppointmentCount(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadToday = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    return load({ from: today, to: today });
  }, [load]);

  return {
    mapped,
    calendarItems,
    source,
    loading,
    lastChecked,
    error,
    individualAppointmentCount,
    load,
    loadToday,
  };
}

export function filterByPractitionerName(
  bookings: MappedBooking[],
  matcher: RegExp
): MappedBooking[] {
  return bookings.filter((b) => matcher.test(safeLowerCase(b.practitionerName, "unknown")));
}

export function filterCalendarByPractitionerName(
  items: MappedCalendarItem[],
  matcher: RegExp
): MappedCalendarItem[] {
  return items.filter((i) => matcher.test(safeLowerCase(i.practitionerName, "unknown")));
}
