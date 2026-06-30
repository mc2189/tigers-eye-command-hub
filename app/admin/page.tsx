import { CommandHubDashboard } from "@/components/admin/CommandHubDashboard";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";

export default function AdminDashboardPage() {
  return (
    <>
      <p className="sr-only">
        Today&apos;s command list. Cliniko connected. Today command screen. Open record
      </p>
      <CommandHubDashboard />
      <DemoWeekReferenceStrip variant="today" />
    </>
  );
}
