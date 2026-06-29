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
import { SourceBadge, StatusBadge } from "./StatusBadge";

interface WeeklyCalendarProps {
  practitionerFilter?: PractitionerId;
  title?: string;
  subtitle?: string;
}

export function WeeklyCalendar({
  practitionerFilter,
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

  const filtered = useMemo(() => {
    return calendarItems.filter((item) => {
      if (practitionerFilter && item.practitionerId !== practitionerFilter) return false;
      if (!practitionerFilter && practitioner !== "all" && item.practitionerId !== practitioner)
        return false;
      if (location !== "all" && item.locationId !== location) return false;
      if (source !== "all" && item.source !== source) return false;
      return weekDays.includes(item.date);
    });
  }, [practitioner, location, source, practitionerFilter]);

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
}: {
  label: string;
  items: CalendarItem[];
  showFinance: boolean;
  showStock: boolean;
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
              compact
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
}: {
  item: CalendarItem;
  showFinance: boolean;
  showStock: boolean;
  compact?: boolean;
}) {
  const isGap = item.isGap;

  return (
    <div
      className={`rounded-lg border p-2.5 text-xs ${
        isGap
          ? "border-dashed border-green/40 bg-green-muted/20"
          : "border-cream-dark bg-cream/50"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-navy">
          {item.startTime}–{item.endTime}
        </span>
        <SourceBadge className={sourceBadgeColors[item.source]}>
          {sourceLabels[item.source]}
        </SourceBadge>
      </div>
      <p className={`mt-1 font-medium text-navy ${compact ? "truncate" : ""}`}>
        {isGap ? "Available gap" : item.title}
      </p>
      {!isGap && item.clientName && (
        <p className="text-slate">{item.clientName}</p>
      )}
      <p className="mt-1 text-slate">
        {getPractitioner(item.practitionerId).shortName} · {getLocation(item.locationId).shortName}
      </p>
      {showFinance && !isGap && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.estimatedFee > 0 && (
            <StatusBadge label={`£${item.estimatedFee}`} variant="info" />
          )}
          <StatusBadge
            label={paymentStatusLabels[item.paymentStatus]}
            variant={item.paymentStatus === "unpaid" ? "warning" : "neutral"}
          />
        </div>
      )}
      {showStock && item.stockWarning && (
        <p className="mt-1 text-amber-700">{item.stockWarning}</p>
      )}
      {!isGap && (
        <div className="mt-2 flex flex-wrap gap-1">
          <ActionLink href="/admin/bookings" label="Open" />
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
