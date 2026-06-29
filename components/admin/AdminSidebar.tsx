"use client";

const ADMIN_FOOTER =
  "Built by Mike Currie · Demo mode · Cliniko remains the system of record";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business } from "@/lib/tigers-eye-content";

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
    title: "Main",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/notes", label: "Notes" },
      { href: "/admin/demo-walkthrough", label: "Demo walkthrough" },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/finance", label: "Finance" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/insurance", label: "Insurance" },
      { href: "/admin/banking", label: "Banking" },
      { href: "/admin/expenses", label: "Expenses" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/external-work", label: "External Work" },
      { href: "/admin/stock", label: "Stock" },
      { href: "/admin/followups", label: "Follow-ups" },
      { href: "/admin/waitlist", label: "Waitlist" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { href: "/admin/cliniko", label: "Cliniko" },
      { href: "/admin/healthcode", label: "Healthcode" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      {navSections.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-muted text-green"
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
        </div>
      </aside>
    </>
  );
}
