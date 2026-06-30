interface PlainEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PlainEmptyState({ title, description, action }: PlainEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-cream-dark bg-white px-6 py-10 text-center">
      <p className="font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
