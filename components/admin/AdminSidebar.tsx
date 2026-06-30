"use client";

import { AdminLogoutButton } from "./AdminLogoutButton";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business } from "@/lib/tigers-eye-content";

const ADMIN_FOOTER =
  "Built by Mike Currie · Demo mode · Cliniko remains the system of record";

interface NavItem {
  href: string;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Daily Work",
    items: [
      { href: "/admin", label: "Today" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/notes", label: "Notes" },
      { href: "/admin/followups", label: "Follow-ups" },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/insurance", label: "Insurance" },
      { href: "/admin/finance", label: "Finance" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/waitlist", label: "Waitlist" },
      { href: "/admin/external-work", label: "External Work" },
      { href: "/admin/stock", label: "Stock" },
    ],
  },
  {
    title: "Setup & Proof",
    items: [
      { href: "/admin/cliniko", label: "Cliniko" },
      { href: "/admin/healthcode", label: "Healthcode" },
      { href: "/admin/proof", label: "Proof" },
      { href: "/admin/cliniko/test-lab", label: "Demo Proof" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      {navSections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate/80">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green text-white shadow-sm"
                        : "text-navy hover:bg-cream-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-navy text-white shadow-lg lg:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-cream-dark bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-cream-dark px-4 py-4">
          <Image
            src={business.logoPath}
            alt={`${business.shortName} logo`}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-sm font-bold text-navy">Command Hub</p>
            <p className="text-xs text-slate">Tigers Eye</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </div>

        <div className="border-t border-cream-dark px-4 py-3">
          <Link
            href="/"
            className="text-xs font-medium text-green hover:underline"
          >
            ← Public website
          </Link>
          <p className="mt-2 text-xs text-slate leading-relaxed">{ADMIN_FOOTER}</p>
          <AdminLogoutButton />
        </div>
      </aside>
    </>
  );
}
