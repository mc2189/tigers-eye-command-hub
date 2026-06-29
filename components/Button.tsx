import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends ComponentProps<"button"> {
  href?: string;
  variant?: ButtonVariant;
  external?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-green text-white hover:bg-green-light border border-transparent",
  secondary:
    "bg-navy text-white hover:bg-navy-light border border-transparent",
  outline:
    "bg-white text-navy border border-navy/20 hover:border-green hover:text-green",
};

export function Button({
  href,
  variant = "primary",
  external,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-base font-semibold transition-colors ${variants[variant]} ${className}`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
