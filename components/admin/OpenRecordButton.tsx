import Link from "next/link";

interface OpenRecordButtonProps {
  appointmentId: string;
  variant?: "primary" | "secondary";
  label?: string;
}

export function OpenRecordButton({
  appointmentId,
  variant = "primary",
  label = "Open record",
}: OpenRecordButtonProps) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-10 items-center rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light"
      : "inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream";

  return (
    <Link href={`/admin/appointments/${appointmentId}`} className={className}>
      {label}
    </Link>
  );
}

interface OpenClientButtonProps {
  patientLabel: string;
  variant?: "primary" | "secondary";
}

export function OpenClientButton({
  patientLabel,
  variant = "primary",
}: OpenClientButtonProps) {
  const slug = patientLabel.trim().toLowerCase().replace(/\s+/g, "-");
  const className =
    variant === "primary"
      ? "inline-flex min-h-10 items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
      : "inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-green hover:bg-cream";

  return (
    <Link href={`/admin/clients/${slug}`} className={className}>
      Open client record
    </Link>
  );
}
