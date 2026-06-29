import type { TeamMember } from "@/lib/tigers-eye-content";

interface TeamCardProps {
  member: TeamMember;
}

export function TeamCard({ member }: TeamCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border p-5 sm:p-6 ${
        member.isPlaceholder
          ? "border-dashed border-slate/30 bg-cream-dark/50"
          : "border-cream-dark bg-white shadow-sm"
      }`}
    >
      {member.isPlaceholder && (
        <span className="mb-3 inline-block w-fit rounded-full bg-slate/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate">
          Demo placeholder
        </span>
      )}
      <h3 className="text-xl font-bold text-navy">{member.name}</h3>
      <p className="mt-1 text-sm font-medium text-green">{member.role}</p>
      {!member.isPlaceholder && (
        <p className="mt-2 text-sm text-slate">{member.qualifications}</p>
      )}
      <p className="mt-4 text-base text-slate leading-relaxed">
        {member.summary}
      </p>
      {member.placeholderPurpose && (
        <p className="mt-3 text-sm italic text-slate">
          {member.placeholderPurpose}
        </p>
      )}
      <div className="mt-5">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-navy">
          Services
        </h4>
        <ul className="mt-2 space-y-1">
          {member.services.map((s) => (
            <li key={s} className="text-base text-slate">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
