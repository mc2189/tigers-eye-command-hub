"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { business } from "@/lib/tigers-eye-content";

export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const configError = searchParams.get("error") === "not_configured";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    configError
      ? "Demo staff login is not configured on this deployment."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Login failed.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <Image
            src={business.logoPath}
            alt={`${business.shortName} logo`}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-navy">Command Hub</h1>
            <p className="text-sm text-slate">Demo staff login</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate">
          Sterile Cliniko test account only. No real patient data. Cliniko remains the
          system of record.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy">
              Demo staff password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-cream-dark px-3 text-base"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in to Command Hub"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate">
          <Link href="/" className="font-medium text-green hover:underline">
            ← Back to public website
          </Link>
        </p>
      </div>
    </div>
  );
}
