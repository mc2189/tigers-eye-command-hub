"use client";

interface SectionTab {
  id: string;
  label: string;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SectionTabs({ tabs, activeId, onChange }: SectionTabsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-cream-dark pb-3">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-green-muted text-green"
                : "text-slate hover:bg-cream-dark hover:text-navy"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
