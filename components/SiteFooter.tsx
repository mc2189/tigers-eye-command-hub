import Link from "next/link";
import Image from "next/image";
import { business, navLinks } from "@/lib/tigers-eye-content";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-cream-dark bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src={business.logoPath}
              alt={`${business.shortName} logo`}
              width={56}
              height={56}
              className="h-14 w-14 object-contain brightness-110"
            />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            {business.tagline}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-green-muted">
            Quick links
          </h2>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/book"
                className="text-sm font-medium text-green-muted transition-colors hover:text-white"
              >
                Book an appointment
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                Command Hub (demo)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-green-muted">
            Contact
          </h2>
          <p className="mt-4 text-sm text-white/80">
            <a
              href={`mailto:${business.email}`}
              className="font-medium text-white hover:underline"
            >
              {business.email}
            </a>
          </p>
          <p className="mt-2 text-sm text-white/70">
            Dundee &amp; Aviemore clinics
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50 sm:px-6">
        &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
      </div>
    </footer>
  );
}
