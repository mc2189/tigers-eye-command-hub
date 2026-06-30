"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  calendarItems,
  weekDays,
  practitioners,
  locations,
  sourceLabels,
  sourceBadgeColors,
  paymentStatusLabels,
  getPractitioner,
  getLocation,
  type PractitionerId,
  type LocationId,
  type BookingSource,
  type CalendarItem,
} from "@/lib/demo-data";
import {
  filterCalendarByPractitionerName,
} from "./useMappedClinikoBookings";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { DataSourceBadge } from "./DataSourceBadge";
import { ActionChip } from "./ActionChip";
import { getWorkflowActionChipsForBooking } from "@/lib/admin-workflow";
import type { MappedCalendarItem } from "@/lib/cliniko-mappers";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { SourceBadge, StatusBadge } from "./StatusBadge";

const DEMO_OVERLAY_SOURCES = new Set<BookingSource>([
  "external-work",
  "admin-block",
  "stock-task",
]);

function demoOverlayItems(): DisplayItem[] {
  return calendarItems
    .filter((item) => DEMO_OVERLAY_SOURCES.has(item.source) || item.isGap)
    .map((item) => ({ ...item, isCliniko: false }));
}

function mapClinikoCalendarItem(i: MappedCalendarItem): DisplayItem {
  return {
    id: i.id,
    date: i.date,
    startTime: i.startTime,
    endTime: i.endTime,
    title: i.title,
    clientName: i.clientName,
    practitionerId: i.practitionerId,
    locationId: i.locationId,
    source: i.source,
    paymentStatus: i.paymentStatus,
    noteStatus: i.noteStatus,
    invoiceStatus: i.invoiceStatus,
    estimatedFee: i.estimatedFee,
    stockWarning: i.stockWarning,
    isGap: i.isGap,
    isCliniko: true,
    workstream: i.workstream,
    paymentRule: i.paymentRule,
    stockImpact: i.stockImpact,
    warnings: i.warnings,
    practitionerMatched: i.practitionerMatched,
    practitionerName: i.practitionerName,
  };
}

type DisplayItem = CalendarItem & {
  isCliniko?: boolean;
  workstream?: string;
  paymentRule?: string;
  stockImpact?: string[];
  warnings?: string[];
  practitionerMatched?: boolean;
  practitionerName?: string;
};

interface WeeklyCalendarProps {
  practitionerFilter?: PractitionerId;
  practitionerNameMatcher?: string;
  title?: string;
  subtitle?: string;
}

export function WeeklyCalendar({
  practitionerFilter,
  practitionerNameMatcher,
  title,
  subtitle,
}: WeeklyCalendarProps) {
  const [practitioner, setPractitioner] = useState<PractitionerId | "all">(
    practitionerFilter ?? "all"
  );
  const [location, setLocation] = useState<LocationId | "all">("all");
  const [source, setSource] = useState<BookingSource | "all">("all");
  const [showFinance, setShowFinance] = useState(true);
  const [showStock, setShowStock] = useState(true);

  const {
    calendarItems: clinikoItems,
    source: clinikoSource,
    loading,
    lastChecked,
    mapped,
    isLive,
    connected,
    error,
    reload,
  } = useCommandHubAppointments();

  const bookingsById = useMemo(() => {
    const map = new Map<string, (typeof mapped)[0]>();
    for (const b of mapped) map.set(b.id, b);
    return map;
  }, [mapped]);

  const activeClinikoItems = useMemo(() => {
    let items = clinikoItems;
    if (practitionerNameMatcher) {
      const re = new RegExp(practitionerNameMatcher, "i");
      items = filterCalendarByPractitionerName(items, re);
    } else if (practitionerFilter) {
      items = items.filter((i) => i.practitionerId === practitionerFilter);
    }
    return items;
  }, [clinikoItems, practitionerNameMatcher, practitionerFilter]);

  const mergedItems = useMemo((): DisplayItem[] => {
    if (isLive) {
      const cliniko = activeClinikoItems.map(mapClinikoCalendarItem);
      return [...cliniko, ...demoOverlayItems()];
    }
    return calendarItems.map((i) => ({ ...i, isCliniko: false }));
  }, [isLive, activeClinikoItems]);

  const filtered = useMemo(() => {
    return mergedItems.filter((item) => {
      if (practitionerFilter && item.practitionerId !== practitionerFilter) return false;
      if (!practitionerFilter && practitioner !== "all" && item.practitionerId !== practitioner)
        return false;
      if (location !== "all" && item.locationId !== location) return false;
      if (source !== "all" && item.source !== source) return false;
      return weekDays.includes(item.date);
    });
  }, [mergedItems, practitioner, location, source, practitionerFilter]);

  const byDay = weekDays.map((day) => ({
    date: day,
    label: new Date(day + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    items: filtered
      .filter((i) => i.date === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-lg font-bold text-navy">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
        </div>
      )}

      {connected && (
        <div className="mb-6 rounded-xl border border-cream-dark bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-navy">Appointment source</h3>
              <p className="text-sm text-slate">
                {isLive
                  ? "Cliniko appointments for this week, with external work and admin overlays."
                  : "Demo calendar until Cliniko returns live appointments."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh from Cliniko"}
            </button>
          </div>
          {loading && <div className="mt-3"><ClinikoLoadState loading /></div>}
          {error && <div className="mt-3"><ClinikoLoadState error={error} /></div>}
          {!loading && (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate">Source</dt>
                <dd><DataSourceBadge source={isLive ? clinikoSource : "demo"} /></dd>
              </div>
              <div>
                <dt className="text-slate">Appointments</dt>
                <dd className="font-medium">{isLive ? mapped.length : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate">On calendar</dt>
                <dd className="font-medium">{isLive ? activeClinikoItems.length : calendarItems.length}</dd>
              </div>
              <div>
                <dt className="text-slate">Last checked</dt>
                <dd className="font-medium">{lastChecked ?? "—"}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {!practitionerFilter && (
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={practitioner}
            onChange={(e) => setPractitioner(e.target.value as PractitionerId | "all")}
            className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm"
            aria-label="Filter by practitioner"
          >
            <option value="all">All practitioners</option>
            {practitioners.filter((p) => !p.isPlaceholder).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as LocationId | "all")}
            className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm"
            aria-label="Filter by location"
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as BookingSource | "all")}
            className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm"
            aria-label="Filter by source"
          >
            <option value="all">All sources</option>
            {(Object.keys(sourceLabels) as BookingSource[]).map((s) => (
              <option key={s} value={s}>{sourceLabels[s]}</option>
            ))}
          </select>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-cream-dark bg-white px-3 text-sm">
            <input type="checkbox" checked={showFinance} onChange={(e) => setShowFinance(e.target.checked)} />
            Finance overlay
          </label>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-cream-dark bg-white px-3 text-sm">
            <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} />
            Stock overlay
          </label>
        </div>
      )}

      <div className="hidden gap-4 lg:grid lg:grid-cols-5">
        {byDay.map((day) => (
          <DayColumn
            key={day.date}
            label={day.label}
            items={day.items}
            showFinance={showFinance}
            showStock={showStock}
            bookingsById={bookingsById}
          />
        ))}
      </div>

      <div className="space-y-4 lg:hidden">
        {byDay.map((day) => (
          <div key={day.date} className="rounded-xl border border-cream-dark bg-white p-4">
            <h3 className="mb-3 font-semibold text-navy">{day.label}</h3>
            {day.items.length === 0 ? (
              <p className="text-sm text-slate">No items</p>
            ) : (
              <div className="space-y-3">
                {day.items.map((item) => (
                  <CalendarCard
                    key={item.id}
                    item={item}
                    showFinance={showFinance}
                    showStock={showStock}
                    compact
                    booking={item.isCliniko ? bookingsById.get(item.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  label,
  items,
  showFinance,
  showStock,
  bookingsById,
}: {
  label: string;
  items: DisplayItem[];
  showFinance: boolean;
  showStock: boolean;
  bookingsById: Map<string, import("@/lib/cliniko-mappers").MappedBooking>;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-center text-sm font-semibold text-navy">{label}</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-cream-dark p-3 text-center text-xs text-slate">
            No items
          </p>
        ) : (
          items.map((item) => (
            <CalendarCard
              key={item.id}
              item={item}
              showFinance={showFinance}
              showStock={showStock}
              booking={item.isCliniko ? bookingsById.get(item.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CalendarCard({
  item,
  showFinance,
  showStock,
  compact,
  booking,
}: {
  item: DisplayItem;
  showFinance: boolean;
  showStock: boolean;
  compact?: boolean;
  booking?: import("@/lib/cliniko-mappers").MappedBooking;
}) {
  const isGap = item.isGap;
  const workflowChips = booking ? getWorkflowActionChipsForBooking(booking) : [];

  return (
    <div
      className={`rounded-lg border p-2.5 text-xs ${
        isGap
          ? "border-dashed border-green/40 bg-green-muted/20"
          : item.isCliniko
            ? "border-blue-200 bg-blue-50/50"
            : "border-cream-dark bg-cream/50"
      }`}
    >
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="font-semibold text-navy">
          {item.startTime}–{item.endTime}
        </span>
        <div className="flex flex-wrap gap-1">
          {item.isCliniko && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
              Cliniko
            </span>
          )}
          <SourceBadge className={sourceBadgeColors[item.source]}>
            {sourceLabels[item.source]}
          </SourceBadge>
        </div>
      </div>
      <p className={`mt-1 font-medium text-navy ${compact ? "truncate" : ""}`}>
        {isGap ? "Available gap" : item.title}
      </p>
      {!isGap && item.clientName && (
        <p className="text-slate">{item.clientName}</p>
      )}
      <p className="mt-1 text-slate">
        {item.practitionerName && !item.practitionerMatched
          ? `${item.practitionerName} (unmatched)`
          : getPractitioner(item.practitionerId).shortName}{" "}
        · {getLocation(item.locationId).shortName}
      </p>
      {item.workstream && (
        <p className="mt-1">
          <StatusBadge label={item.workstream} variant="neutral" />
        </p>
      )}
      {workflowChips.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {workflowChips.map((chip) => (
            <ActionChip
              key={chip.label}
              label={chip.label}
              kind={chip.kind}
              inferred={chip.inferred}
            />
          ))}
        </div>
      )}
      {showFinance && !isGap && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.estimatedFee > 0 && (
            <StatusBadge label={`£${item.estimatedFee}`} variant="info" />
          )}
          {item.paymentRule && (
            <StatusBadge label={item.paymentRule.slice(0, 24)} variant="warning" />
          )}
          <StatusBadge
            label={paymentStatusLabels[item.paymentStatus]}
            variant={item.paymentStatus === "unpaid" ? "warning" : "neutral"}
          />
          {(item.noteStatus === "not-started" || item.noteStatus === "draft-needed") && (
            <StatusBadge label="Note needed" variant="warning" />
          )}
        </div>
      )}
      {showStock && (item.stockWarning || (item.stockImpact && item.stockImpact.length > 0)) && (
        <p className="mt-1 text-amber-700">
          {item.stockWarning ?? `Stock: ${item.stockImpact?.join(", ")}`}
        </p>
      )}
      {!isGap && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(booking?.id ?? item.id) && (
            <Link
              href={`/admin/appointments/${booking?.id ?? item.id}`}
              className="rounded bg-green px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-green-light"
            >
              Open record
            </Link>
          )}
          <ActionLink href="/admin/bookings" label="Bookings" />
          <ActionLink href="/admin/notes" label="Note" />
          <ActionLink href="/admin/invoices" label="Invoice" />
        </div>
      )}
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-green hover:underline"
    >
      {label}
    </Link>
  );
}
