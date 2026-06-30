"use client";

interface WhatThisShowsProps {
  children: string;
  className?: string;
}

export function WhatThisShows({ children, className = "" }: WhatThisShowsProps) {
  return (
    <div
      className={`rounded-lg border border-cream-dark bg-cream/50 px-4 py-3 text-sm text-slate ${className}`}
    >
      <p className="font-medium text-navy">What this shows</p>
      <p className="mt-1 leading-relaxed">{children}</p>
    </div>
  );
}
