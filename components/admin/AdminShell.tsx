import type { ReactNode } from "react";
import { DemoBanner } from "./DemoBanner";
import { AdminSidebar } from "./AdminSidebar";

const ADMIN_FOOTER =
  "Built by Mike Currie · Demo mode · Cliniko remains the system of record";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <DemoBanner />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-cream-dark px-4 py-3 text-center text-xs text-slate sm:px-6 lg:hidden">
            {ADMIN_FOOTER}
          </footer>
        </div>
      </div>
    </div>
  );
}
