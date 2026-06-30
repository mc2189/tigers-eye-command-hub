interface WorkflowHelpPanelProps {
  title: string;
  items: string[];
}

export function WorkflowHelpPanel({ title, items }: WorkflowHelpPanelProps) {
  return (
    <aside className="rounded-xl border border-cream-dark bg-cream/40 p-5">
      <h2 className="text-sm font-semibold text-navy">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-green" aria-hidden>
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
