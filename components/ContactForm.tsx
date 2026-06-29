"use client";

import { useState, type FormEvent } from "react";
import { business, contactForm } from "@/lib/tigers-eye-content";
import { Button } from "./Button";
import { Callout } from "./Callout";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Callout variant="success" title="Enquiry received (demo)">
        <p>{contactForm.successMessage}</p>
        <p className="mt-2 text-sm">
          In the live Command Hub, this would appear as an enquiry card for George
          to review and respond.
        </p>
      </Callout>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {contactForm.fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            className="mb-2 block text-base font-medium text-navy"
          >
            {field.label}
            {field.required && (
              <span className="text-green" aria-hidden>
                {" "}
                *
              </span>
            )}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.id}
              name={field.id}
              required={field.required}
              rows={5}
              className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-base text-navy"
            />
          ) : field.type === "select" ? (
            <select
              id={field.id}
              name={field.id}
              className="w-full min-h-11 rounded-lg border border-cream-dark bg-white px-4 py-3 text-base text-navy"
            >
              <option value="">Select…</option>
              {"options" in field &&
                field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          ) : (
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              required={field.required}
              className="w-full min-h-11 rounded-lg border border-cream-dark bg-white px-4 py-3 text-base text-navy"
            />
          )}
        </div>
      ))}
      <Button type="submit" variant="primary">
        {contactForm.submitLabel}
      </Button>
      <p className="text-sm text-slate">
        Demo only — no data is sent. Email{" "}
        <a
          href={`mailto:${business.email}`}
          className="font-medium text-green hover:underline"
        >
          {business.email}
        </a>{" "}
        directly for urgent enquiries.
      </p>
    </form>
  );
}
