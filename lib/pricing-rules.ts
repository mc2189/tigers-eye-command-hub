export const FALLBACK_PRICES: Record<string, number> = {
  "initial physio assessment": 55,
  "follow-up treatment": 40,
  "sports massage 60 min": 55,
  "sports massage 30 min": 35,
  "sports massage": 55,
  "acupuncture": 45,
  "telehealth review": 35,
  "injection consultation": 60,
  "steroid injection consultation": 60,
  "insurance assessment": 0,
  "insurance initial assessment": 0,
  "insurance follow-up": 0,
  "external work": 0,
};

const PAYMENT_RULES: { match: RegExp; rule: string }[] = [
  { match: /telehealth|online|video|remote/i, rule: "Full payment before appointment" },
  { match: /sports massage|massage/i, rule: "Deposit recommended" },
  { match: /initial|assessment/i, rule: "Deposit or full payment recommended" },
  { match: /insurance|aviva|vitality|claim|authorisation/i, rule: "Claim details and session tracking required" },
  { match: /follow-up|follow up/i, rule: "Optional online / pay in clinic" },
  { match: /cash/i, rule: "Cash agreement — flag for admin review" },
  { match: /external|sse|sfa|corporate|site visit/i, rule: "External invoice tracker" },
];

export function getFallbackPriceForAppointmentType(name: string): number {
  const lower = name.toLowerCase().trim();
  if (FALLBACK_PRICES[lower] !== undefined) return FALLBACK_PRICES[lower];

  for (const [key, price] of Object.entries(FALLBACK_PRICES)) {
    if (lower.includes(key)) return price;
  }

  if (/insurance|aviva|vitality/i.test(lower)) return 0;
  if (/external|sse|sfa/i.test(lower)) return 0;
  if (/telehealth|video|online/i.test(lower)) return 35;
  if (/massage/i.test(lower)) return /30/.test(lower) ? 35 : 55;
  if (/physio|assessment/i.test(lower)) return /initial|first/.test(lower) ? 55 : 40;
  if (/acupuncture/i.test(lower)) return 45;
  if (/injection/i.test(lower)) return 60;

  return 0;
}

export function getPaymentRuleForAppointmentType(name: string): string {
  const lower = name.toLowerCase();
  for (const { match, rule } of PAYMENT_RULES) {
    if (match.test(lower)) return rule;
  }
  return "Review payment rule";
}

export function getFinanceWarningsForAppointmentType(
  name: string,
  price?: number
): string[] {
  const warnings: string[] = [];
  const lower = name.toLowerCase();

  if (price === undefined || price === 0) {
    if (!/insurance|aviva|vitality|external|sse|sfa/i.test(lower)) {
      warnings.push("Price missing — using fallback or £0");
    }
  }

  if (/insurance|aviva|vitality|claim/i.test(lower)) {
    warnings.push("Insurance booking — claim/session details may be needed");
  }

  if (/telehealth|video|online|remote/i.test(lower)) {
    warnings.push("Telehealth — payment should be confirmed before appointment");
  }

  if (getPaymentRuleForAppointmentType(name) === "Review payment rule") {
    warnings.push("Payment rule needs review");
  }

  return warnings;
}
