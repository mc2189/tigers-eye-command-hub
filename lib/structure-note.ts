const SECTION_KEYWORDS: Record<string, RegExp[]> = {
  Subjective: [/patient reports/i, /complains of/i, /reports/i, /pain/i, /symptoms/i, /history/i, /feels/i, /describes/i],
  Objective: [/on examination/i, /examined/i, /range of motion/i, /rom/i, /strength/i, /palpation/i, /observed/i, /findings/i],
  Assessment: [/assessment/i, /diagnosis/i, /likely/i, /consistent with/i, /impression/i, /clinical/i],
  "Treatment provided": [/treated with/i, /treatment/i, /mobilisation/i, /massage/i, /acupuncture/i, /tape/i, /exercises/i, /manual/i, /technique/i],
  "Advice given": [/advised/i, /advice/i, /recommended/i, /education/i, /home exercise/i, /ergonomic/i],
  Plan: [/plan/i, /follow.?up/i, /next session/i, /review in/i, /rebook/i, /continue/i],
  "Follow-up": [/follow.?up/i, /review/i, /reassess/i, /check.?in/i],
  "Insurance/session notes": [/insurance/i, /session/i, /authorisation/i, /claim/i, /aviva/i, /vitality/i],
};

export function structureNote(
  rawText: string,
  templateSections: string[]
): Record<string, string> {
  const sentences = rawText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: Record<string, string> = {};
  const assigned = new Set<number>();

  for (const section of templateSections) {
    const keywords = SECTION_KEYWORDS[section] ?? [];
    const matched: string[] = [];

    sentences.forEach((sentence, idx) => {
      if (assigned.has(idx)) return;
      if (keywords.some((re) => re.test(sentence))) {
        matched.push(sentence);
        assigned.add(idx);
      }
    });

    result[section] = matched.length > 0 ? matched.join(" ") : "";
  }

  const unassigned = sentences
    .filter((_, idx) => !assigned.has(idx))
    .join(" ");

  if (unassigned) {
    const planKey = templateSections.find((s) => s === "Plan") ?? templateSections[templateSections.length - 1];
    result[planKey] = [result[planKey], unassigned].filter(Boolean).join(" ");
  }

  for (const section of templateSections) {
    if (!result[section]) {
      result[section] = "—";
    }
  }

  return result;
}
