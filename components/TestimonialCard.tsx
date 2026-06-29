import type { Testimonial } from "@/lib/tigers-eye-content";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <blockquote className="flex h-full flex-col rounded-xl border border-cream-dark bg-white p-5 shadow-sm sm:p-6">
      <p className="flex-1 text-base leading-relaxed text-navy">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <footer className="mt-4 border-t border-cream-dark pt-4">
        <cite className="not-italic">
          <span className="font-semibold text-navy">{testimonial.author}</span>
          <span className="text-slate"> &mdash; {testimonial.location}</span>
        </cite>
      </footer>
    </blockquote>
  );
}
