"use client";

import { useCallback, useState } from "react";
import {
  mapClinikoBookings,
  mapClinikoBookingToCalendarItem,
  type ClinikoAppointmentTypeInput,
  type ClinikoBookingInput,
  type MappedBooking,
  type MappedCalendarItem,
  type DataSource,
} from "@/lib/cliniko-mappers";

interface LoadResult {
  mapped: MappedBooking[];
  calendarItems: MappedCalendarItem[];
  source: DataSource;
  lastChecked: string;
}

export function useMappedClinikoBookings() {
  const [mapped, setMapped] = useState<MappedBooking[]>([]);
  const [calendarItems, setCalendarItems] = useState<MappedCalendarItem[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (params?: { from?: string; to?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ perPage: "50" });
      if (params?.from) query.set("from", params.from);
      if (params?.to) query.set("to", params.to);

      const [bookingsRes, typesRes] = await Promise.all([
        fetch(`/api/cliniko/bookings?${query}`, { cache: "no-store" }),
        fetch("/api/cliniko/appointment-types", { cache: "no-store" }),
      ]);

      const bookingsJson = (await bookingsRes.json()) as {
        bookings: ClinikoBookingInput[];
        source: DataSource;
      };
      const typesJson = (await typesRes.json()) as {
        appointmentTypes: ClinikoAppointmentTypeInput[];
      };

      const mappedBookings = mapClinikoBookings(bookingsJson.bookings ?? [], {
        appointmentTypes: typesJson.appointmentTypes ?? [],
      });
      const calItems = mappedBookings.map(mapClinikoBookingToCalendarItem);

      setMapped(mappedBookings);
      setCalendarItems(calItems);
      setSource(bookingsJson.source ?? "demo");
      setLastChecked(new Date().toLocaleString("en-GB"));

      return {
        mapped: mappedBookings,
        calendarItems: calItems,
        source: bookingsJson.source ?? "demo",
        lastChecked: new Date().toLocaleString("en-GB"),
      } satisfies LoadResult;
    } catch {
      setError("Cliniko could not be reached. Demo data is still available.");
      setMapped([]);
      setCalendarItems([]);
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
    load,
    loadToday,
  };
}

export function filterByPractitionerName(
  bookings: MappedBooking[],
  matcher: RegExp
): MappedBooking[] {
  return bookings.filter((b) => matcher.test(b.practitionerName.toLowerCase()));
}

export function filterCalendarByPractitionerName(
  items: MappedCalendarItem[],
  matcher: RegExp
): MappedCalendarItem[] {
  return items.filter((i) => matcher.test(i.practitionerName.toLowerCase()));
}
