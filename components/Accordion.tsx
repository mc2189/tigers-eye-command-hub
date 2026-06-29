"use client";

import { useState, type ReactNode } from "react";

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-cream-dark last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full min-h-12 items-center justify-between gap-4 py-4 text-left text-base font-semibold text-navy hover:text-green"
      >
        <span>{title}</span>
        <span
          aria-hidden
          className="shrink-0 text-xl text-green transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "none" }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="pb-4 text-base text-slate leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function Accordion({ children, className = "" }: AccordionProps) {
  return (
    <div
      className={`divide-y divide-cream-dark rounded-xl border border-cream-dark bg-white px-4 sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}
