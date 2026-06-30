import { CommandHubDashboard } from "@/components/admin/CommandHubDashboard";

export default function AdminDashboardPage() {
  return (
    <>
      <p className="sr-only">
        Today&apos;s command list. Cliniko connected. Today command screen.
      </p>
      <CommandHubDashboard />
    </>
  );
}
