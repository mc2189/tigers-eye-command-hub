import type { Metadata } from "next";
import { business } from "@/lib/tigers-eye-content";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: business.name,
    template: `%s | ${business.shortName}`,
  },
  description: business.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">{children}</body>
    </html>
  );
}
