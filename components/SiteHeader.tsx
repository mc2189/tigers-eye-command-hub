import Link from "next/link";
import Image from "next/image";
import { business, navLinks } from "@/lib/tigers-eye-content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-cream-dark bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src={business.logoPath}
            alt={`${business.shortName} logo`}
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="hidden text-sm font-semibold leading-tight text-navy sm:block">
            {business.shortName}
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate transition-colors hover:bg-cream hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/book"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-light"
        >
          Book now
        </Link>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex gap-1 overflow-x-auto border-t border-cream-dark px-4 py-2 lg:hidden"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate whitespace-nowrap hover:bg-cream hover:text-navy"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
