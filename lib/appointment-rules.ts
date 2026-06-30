import { safeString } from "@/lib/safe-data";

export type AppointmentCategory =
  | "initial-physio"
  | "follow-up-physio"
  | "sports-massage"
  | "telehealth"
  | "insurance-initial"
  | "insurance-follow-up"
  | "acupuncture"
  | "steroid-injection"
  | "taping"
  | "external-corporate"
  | "unknown";

const KEYWORDS = {
  insurance: ["insurance", "aviva", "vitality", "claim", "authorisation", "authorised"],
  telehealth: ["telehealth", "video", "remote", "online"],
  massage: ["massage", "sports massage"],
  acupuncture: ["acupuncture"],
  injection: ["injection", "steroid"],
  taping: ["taping", "tape"],
  initial: ["initial", "first appointment", "assessment"],
  followUp: ["follow-up", "follow up", "review"],
  external: ["external", "corporate", "site visit", "sse", "sfa"],
};

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function detectAppointmentCategory(name: string): AppointmentCategory {
  const lower = safeString(name).toLowerCase().trim();
  if (!lower) return "unknown";

  if (matchesAny(lower, KEYWORDS.insurance)) {
    if (matchesAny(lower, KEYWORDS.initial)) return "insurance-initial";
    if (matchesAny(lower, KEYWORDS.followUp)) return "insurance-follow-up";
    return "insurance-initial";
  }
  if (matchesAny(lower, KEYWORDS.telehealth)) return "telehealth";
  if (matchesAny(lower, KEYWORDS.massage)) return "sports-massage";
  if (matchesAny(lower, KEYWORDS.acupuncture)) return "acupuncture";
  if (matchesAny(lower, KEYWORDS.injection)) return "steroid-injection";
  if (matchesAny(lower, KEYWORDS.taping)) return "taping";
  if (matchesAny(lower, KEYWORDS.external)) return "external-corporate";
  if (matchesAny(lower, KEYWORDS.initial)) return "initial-physio";
  if (matchesAny(lower, KEYWORDS.followUp)) return "follow-up-physio";
  if (/physio|treatment/i.test(lower)) return "follow-up-physio";

  return "unknown";
}

export function categoryLabel(category: AppointmentCategory): string {
  const labels: Record<AppointmentCategory, string> = {
    "initial-physio": "Initial physio",
    "follow-up-physio": "Follow-up physio",
    "sports-massage": "Sports massage",
    telehealth: "Telehealth",
    "insurance-initial": "Insurance initial",
    "insurance-follow-up": "Insurance follow-up",
    acupuncture: "Acupuncture",
    "steroid-injection": "Steroid injection consultation",
    taping: "Taping",
    "external-corporate": "External/corporate",
    unknown: "Unknown",
  };
  return labels[category];
}

export function getStockItemsForCategory(category: AppointmentCategory): string[] {
  switch (category) {
    case "sports-massage":
      return ["Couch roll", "Lotion"];
    case "taping":
      return ["Tape"];
    case "acupuncture":
      return ["Needles"];
    case "steroid-injection":
      return ["Clinical consumables"];
    case "initial-physio":
    case "follow-up-physio":
      return ["Couch roll", "Cleaning supplies"];
    case "telehealth":
      return [];
    default:
      return [];
  }
}

export function getSuggestedNoteTemplate(category: AppointmentCategory): string {
  switch (category) {
    case "initial-physio":
      return "Initial assessment note";
    case "follow-up-physio":
      return "Follow-up note";
    case "sports-massage":
      return "Sports massage note";
    case "telehealth":
      return "Telehealth review note";
    case "insurance-initial":
    case "insurance-follow-up":
      return "Insurance review note";
    case "acupuncture":
      return "Acupuncture note";
    default:
      return "General treatment note";
  }
}

export function getFollowUpSuggestionForCategory(category: AppointmentCategory): {
  suggested: boolean;
  messageType?: string;
  reason?: string;
} {
  switch (category) {
    case "initial-physio":
      return {
        suggested: true,
        messageType: "Rebook follow-up",
        reason: "Initial appointments usually need a follow-up booking prompt.",
      };
    case "follow-up-physio":
      return {
        suggested: true,
        messageType: "Progress check-in",
        reason: "Check whether a further review is needed after this follow-up.",
      };
    case "insurance-initial":
    case "insurance-follow-up":
      return {
        suggested: true,
        messageType: "Authorised sessions reminder",
        reason: "Check authorised sessions remaining after insurance appointments.",
      };
    case "telehealth":
      return {
        suggested: true,
        messageType: "Aftercare check-in",
        reason: "Send a short aftercare message after telehealth sessions.",
      };
    case "unknown":
      return {
        suggested: false,
        messageType: "Follow-up rule not configured",
        reason: "Add a follow-up rule for this appointment type when you know the clinic workflow.",
      };
    default:
      return { suggested: false };
  }
}

export function getSetupWarningsForCategory(
  category: AppointmentCategory,
  appointmentTypeName: string
): string[] {
  const warnings: string[] = [];
  if (category === "unknown") {
    warnings.push(`Missing price for appointment type`);
    warnings.push(`Payment rule not configured`);
    warnings.push(`Follow-up rule not configured`);
  }
  if (!appointmentTypeName.trim()) {
    warnings.push("Unknown appointment type");
  }
  return warnings;
}
