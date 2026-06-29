import { AdminShellGate } from "@/components/admin/AdminShellGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShellGate>{children}</AdminShellGate>;
}
