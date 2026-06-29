import Link from "next/link";

interface PublicHubNoteProps {
  children: React.ReactNode;
}

export function PublicHubNote({ children }: PublicHubNoteProps) {
  return (
    <aside className="mt-8 max-w-3xl rounded-xl border border-cream-dark bg-white/80 px-4 py-3 text-sm text-slate">
      <span className="font-medium text-navy">Command Hub: </span>
      {children}{" "}
      <Link href="/admin" className="font-medium text-green hover:underline">
        View admin demo →
      </Link>
    </aside>
  );
}
