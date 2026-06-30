import {
  detectAppointmentCategory,
  type AppointmentCategory,
} from "@/lib/appointment-rules";
import { getFallbackPriceForAppointmentType } from "@/lib/pricing-rules";
import { safeString } from "@/lib/safe-data";

export interface AppointmentCommercialRule {
  appointmentTypePattern: string;
  price?: number;
  paymentExpected: boolean;
  invoiceUsuallyRequired: boolean;
  depositSuggested?: boolean;
  followUpSuggested?: boolean;
}

/** Demo/test configuration only — not George's live price list. */
export const DEMO_COMMERCIAL_RULES: AppointmentCommercialRule[] = [
  {
    appointmentTypePattern: "initial",
    price: 55,
    paymentExpected: true,
    invoiceUsuallyRequired: true,
    depositSuggested: true,
    followUpSuggested: true,
  },
  {
    appointmentTypePattern: "follow-up",
    price: 40,
    paymentExpected: true,
    invoiceUsuallyRequired: false,
    followUpSuggested: true,
  },
  {
    appointmentTypePattern: "massage",
    price: 55,
    paymentExpected: true,
    invoiceUsuallyRequired: true,
    depositSuggested: true,
  },
  {
    appointmentTypePattern: "telehealth",
    price: 35,
    paymentExpected: true,
    invoiceUsuallyRequired: true,
  },
  {
    appointmentTypePattern: "insurance",
    paymentExpected: false,
    invoiceUsuallyRequired: true,
    followUpSuggested: true,
  },
  {
    appointmentTypePattern: "acupuncture",
    price: 45,
    paymentExpected: true,
    invoiceUsuallyRequired: true,
  },
  {
    appointmentTypePattern: "injection",
    price: 60,
    paymentExpected: true,
    invoiceUsuallyRequired: true,
  },
  {
    appointmentTypePattern: "taping",
    price: 25,
    paymentExpected: true,
    invoiceUsuallyRequired: false,
  },
  {
    appointmentTypePattern: "external",
    paymentExpected: false,
    invoiceUsuallyRequired: true,
  },
];

export interface CommercialContext {
  rule: AppointmentCommercialRule | null;
  price: number | undefined;
  priceConfigured: boolean;
  priceSource: "cliniko" | "demo-rule" | "fallback" | "not-configured";
  paymentExpected: boolean;
  invoiceUsuallyRequired: boolean;
  depositSuggested: boolean;
  followUpSuggested: boolean;
}

function matchRule(name: string): AppointmentCommercialRule | null {
  const lower = safeString(name).toLowerCase();
  for (const rule of DEMO_COMMERCIAL_RULES) {
    if (lower.includes(rule.appointmentTypePattern.toLowerCase())) return rule;
  }
  return null;
}

export function getCommercialContext(
  appointmentTypeName: string,
  options?: {
    clinikoPrice?: number;
    priceSource?: "cliniko" | "fallback" | "missing";
    category?: AppointmentCategory;
  }
): CommercialContext {
  const rule = matchRule(appointmentTypeName);
  const category = options?.category ?? detectAppointmentCategory(appointmentTypeName);

  let price: number | undefined;
  let priceConfigured = false;
  let priceSource: CommercialContext["priceSource"] = "not-configured";

  if (options?.priceSource === "cliniko" && options.clinikoPrice !== undefined && options.clinikoPrice > 0) {
    price = options.clinikoPrice;
    priceConfigured = true;
    priceSource = "cliniko";
  } else if (rule?.price !== undefined) {
    price = rule.price;
    priceConfigured = true;
    priceSource = "demo-rule";
  } else if (options?.priceSource === "fallback") {
    const fallback = getFallbackPriceForAppointmentType(appointmentTypeName);
    if (fallback > 0) {
      price = fallback;
      priceConfigured = true;
      priceSource = "fallback";
    }
  } else {
    const fallback = getFallbackPriceForAppointmentType(appointmentTypeName);
    if (fallback > 0 && category !== "unknown") {
      price = fallback;
      priceConfigured = true;
      priceSource = "fallback";
    }
  }

  const isInsurance =
    category === "insurance-initial" ||
    category === "insurance-follow-up" ||
    /insurance|aviva|vitality/i.test(appointmentTypeName);

  return {
    rule,
    price,
    priceConfigured,
    priceSource,
    paymentExpected: rule?.paymentExpected ?? (!isInsurance && category !== "external-corporate"),
    invoiceUsuallyRequired: rule?.invoiceUsuallyRequired ?? true,
    depositSuggested: rule?.depositSuggested ?? false,
    followUpSuggested: rule?.followUpSuggested ?? category === "initial-physio",
  };
}
