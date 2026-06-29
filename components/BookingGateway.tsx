"use client";

import { useState } from "react";
import {
  bookingRoutes,
  clinics,
  type BookingRoute,
  type ClinicId,
} from "@/lib/tigers-eye-content";
import { Button } from "./Button";
import { Callout } from "./Callout";

type Step = "location" | "route" | "confirm";

export function BookingGateway() {
  const [step, setStep] = useState<Step>("location");
  const [clinicId, setClinicId] = useState<ClinicId | null>(null);
  const [route, setRoute] = useState<BookingRoute | null>(null);

  const selectedClinic = clinics.find((c) => c.id === clinicId);
  const selectedRoute = bookingRoutes.find((r) => r.id === route);

  function reset() {
    setStep("location");
    setClinicId(null);
    setRoute(null);
  }

  function getBookingUrl(): string | null {
    if (!selectedClinic) return null;
    if (route === "telehealth") return "/telehealth";
    if (route === "insurance") return "/insurance";
    return selectedClinic.bookingUrl;
  }

  const bookingUrl = getBookingUrl();
  const isExternal = bookingUrl?.startsWith("http");

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Booking steps">
        {(["location", "route", "confirm"] as Step[]).map((s, i) => {
          const labels = ["Choose location", "Appointment type", "Confirm"];
          const active =
            s === step ||
            (s === "location" && step !== "location") ||
            (s === "route" && step === "confirm");
          return (
            <li
              key={s}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                active
                  ? "bg-green text-white"
                  : "bg-cream-dark text-slate"
              }`}
            >
              {i + 1}. {labels[i]}
            </li>
          );
        })}
      </ol>

      {step === "location" && (
        <div>
          <h2 className="text-xl font-bold text-navy">Where would you like to visit?</h2>
          <p className="mt-2 text-base text-slate">
            Choose your clinic first. Dundee uses Cliniko; Aviemore uses Setmore.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                type="button"
                onClick={() => {
                  setClinicId(clinic.id);
                  setStep("route");
                }}
                className="min-h-24 rounded-xl border-2 border-cream-dark bg-white p-5 text-left transition-colors hover:border-green hover:shadow-sm"
              >
                <span className="text-lg font-bold text-navy">{clinic.name}</span>
                <span className="mt-1 block text-sm text-slate">
                  {clinic.bookingSystem}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "route" && selectedClinic && (
        <div>
          <button
            type="button"
            onClick={() => setStep("location")}
            className="mb-4 text-sm font-medium text-green hover:underline"
          >
            ← Change location
          </button>
          <h2 className="text-xl font-bold text-navy">
            What type of appointment?
          </h2>
          <p className="mt-2 text-base text-slate">
            Booking at <strong>{selectedClinic.name}</strong>. Your choice mirrors
            the Command Hub modules.
          </p>
          <div className="mt-6 space-y-3">
            {bookingRoutes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoute(r.id);
                  setStep("confirm");
                }}
                className="w-full min-h-20 rounded-xl border-2 border-cream-dark bg-white p-4 text-left transition-colors hover:border-green"
              >
                <span className="block text-base font-semibold text-navy">
                  {r.label}
                </span>
                <span className="mt-1 block text-sm text-slate">
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "confirm" && selectedClinic && selectedRoute && (
        <div>
          <button
            type="button"
            onClick={() => setStep("route")}
            className="mb-4 text-sm font-medium text-green hover:underline"
          >
            ← Change appointment type
          </button>
          <h2 className="text-xl font-bold text-navy">Ready to book</h2>

          <div className="mt-6 space-y-4 rounded-xl border border-cream-dark bg-white p-5">
            <dl className="space-y-3 text-base">
              <div>
                <dt className="text-sm font-semibold text-slate">Location</dt>
                <dd className="text-navy">{selectedClinic.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate">Appointment type</dt>
                <dd className="text-navy">{selectedRoute.label}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate">Booking system</dt>
                <dd className="text-navy">{selectedClinic.bookingSystem}</dd>
              </div>
            </dl>
          </div>

          <Callout title="Command Hub connection" variant="info">
            <p>{selectedRoute.adminNote}</p>
            {route === "insurance" && (
              <p className="mt-2">
                Insurance details captured for admin follow-up before treatment
                is confirmed.
              </p>
            )}
          </Callout>

          <div className="mt-6 flex flex-wrap gap-3">
            {bookingUrl && isExternal && (
              <Button href={bookingUrl} external variant="primary">
                Continue to {selectedClinic.bookingSystem}
              </Button>
            )}
            {bookingUrl && !isExternal && (
              <Button href={bookingUrl} variant="primary">
                Continue to booking info
              </Button>
            )}
            <Button type="button" variant="outline" onClick={reset}>
              Start over
            </Button>
          </div>

          <p className="mt-4 text-sm text-slate">
            {selectedClinic.availabilityNote}
          </p>
        </div>
      )}
    </div>
  );
}
