export type ClinicId = "dundee" | "aviemore";

export type BookingRoute =
  | "private"
  | "insurance"
  | "telehealth"
  | "cash-by-agreement"
  | "external";

export interface Clinic {
  id: ClinicId;
  name: string;
  shortName: string;
  address: string;
  addressLines: string[];
  bookingUrl: string;
  bookingSystem: string;
  availabilityNote: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  summary: string;
  services: string[];
  isPlaceholder?: boolean;
  placeholderPurpose?: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  whoItsFor?: string[];
  includes?: string[];
  conditions?: string[];
  benefits?: string[];
  risks?: string[];
  importantNotes?: string[];
  nextSteps?: string[];
  fee?: string;
  assessmentRequired?: boolean;
  isProposed?: boolean;
  category: "hands-on" | "injection" | "virtual" | "support";
}

export interface InsuranceProvider {
  id: string;
  name: string;
  summary: string;
  eligibility: string;
  paperworkSupport: string;
  clientAction: string;
  requiredDetails: string[];
}

export interface Testimonial {
  id: string;
  author: string;
  location: string;
  quote: string;
}

export interface NavLink {
  href: string;
  label: string;
}

export const business = {
  name: "Tigers Eye Physiotherapy and Massage",
  shortName: "Tigers Eye",
  tagline: "Expert, evidence-based physiotherapy and massage",
  description:
    "Tigers Eye offers expert, evidence-based care from fully qualified therapists with elite sports experience. It combines clinical training with a practical, hands-on approach to help clients recover efficiently, manage their own progress and regain confidence in their bodies.",
  positioning:
    "Unlike general massage providers, Tigers Eye offers a deeper level of assessment and treatment, helping clients receive the right intervention for lasting results rather than short-term relief.",
  email: "george@tigerseye.org.uk",
  logoPath: "/brand/tigers-eye-logo.avif",
} as const;

export const clinics: Clinic[] = [
  {
    id: "dundee",
    name: "Dundee",
    shortName: "Dundee",
    address: "Within Kanzen Karate, 21-23 Mains Loan, Dundee, DD4 7AB",
    addressLines: [
      "Within Kanzen Karate",
      "21-23 Mains Loan",
      "Dundee",
      "DD4 7AB",
    ],
    bookingUrl: "https://tigers-eye.uk1.cliniko.com/bookings",
    bookingSystem: "Cliniko",
    availabilityNote:
      "Check Cliniko for live appointment availability at Dundee.",
  },
  {
    id: "aviemore",
    name: "Aviemore",
    shortName: "Aviemore",
    address:
      "Strathspey Business Centre, Dalfaber Industrial Estate, Aviemore, PH22 1SB",
    addressLines: [
      "Strathspey Business Centre",
      "Dalfaber Industrial Estate",
      "Aviemore",
      "PH22 1SB",
    ],
    bookingUrl: "https://tigerseye.setmore.com/",
    bookingSystem: "Setmore",
    availabilityNote:
      "Check Setmore for live appointment availability at Aviemore.",
  },
];

export const bookingLinks = {
  dundee: clinics[0].bookingUrl,
  aviemore: clinics[1].bookingUrl,
} as const;

export const team: TeamMember[] = [
  {
    id: "george-stewart",
    name: "George Stewart",
    role: "Lead Physiotherapist and founder",
    qualifications: "BSc (Hons), MCSP, HCPC, Dip MA, Dip OA, Dip IASTM",
    summary:
      "George founded Tigers Eye in 2012 to provide honest, effective and patient-centred care. He has over a decade of experience across private healthcare and elite sport, including Scottish football clubs and national-level sport.",
    services: [
      "Physiotherapy",
      "Sports massage",
      "Acupuncture",
      "Osteopathic articulation",
      "Taping",
      "Fascial release",
      "Rehabilitation planning",
      "Home exercise programmes",
    ],
  },
  {
    id: "jamie-lee-thomson",
    name: "Jamie Lee Thomson",
    role: "Sports Massage Therapist",
    qualifications: "BSc (Hons)",
    summary:
      "Jamie Lee joined Tigers Eye in 2023. She has a background in sports and exercise science, athletic performance and rehabilitation, and is currently pursuing a Master's degree in Physiotherapy.",
    services: ["Sports massage", "Taping"],
  },
  {
    id: "future-practitioner",
    name: "Additional Practitioner / Room User",
    role: "Future practitioner placeholder",
    qualifications: "—",
    summary:
      "Reserved for an additional practitioner or room user within the Tigers Eye Command Hub demo.",
    services: ["Room booking", "Shared clinic workflows"],
    isPlaceholder: true,
    placeholderPurpose:
      "Shows that the Command Hub can support another practitioner such as Dicker or future room users.",
  },
];

export const services: Service[] = [
  {
    id: "physiotherapy",
    slug: "physiotherapy",
    title: "Physiotherapy",
    tagline: "Science-based movement, pain and recovery support",
    summary:
      "Hands-on assessment and treatment to reduce pain, restore movement and build lasting recovery.",
    conditions: [
      "Back and neck pain",
      "Sports injuries",
      "Joint issues",
      "Post-surgery rehabilitation",
      "Neurological conditions",
      "Workplace and repetitive strain injuries",
      "Postural problems",
    ],
    includes: [
      "Manual therapy",
      "Joint mobilisation",
      "Rehabilitation programmes",
      "Sports injury treatment",
      "Post-operative recovery support",
      "Pain education",
      "Gait and posture correction",
      "Home exercise support",
    ],
    category: "hands-on",
  },
  {
    id: "sports-massage",
    slug: "sports-massage",
    title: "Sports Massage",
    tagline: "Targeted therapy for tension, recovery and performance",
    summary:
      "Focused soft tissue work to ease muscle tension, support injury prevention and aid recovery.",
    whoItsFor: [
      "Athletes and gym users",
      "Office workers with stiffness",
      "Anyone with daily aches or recovery needs",
    ],
    includes: [
      "Deep tissue techniques",
      "Trigger point work",
      "Stretching and mobility support",
    ],
    category: "hands-on",
  },
  {
    id: "acupuncture",
    slug: "acupuncture",
    title: "Acupuncture",
    tagline: "Medical acupuncture alongside physiotherapy",
    summary:
      "Used alongside physiotherapy to help reduce pain, ease muscle tension and support recovery using evidence-informed techniques.",
    benefits: [
      "Pain relief support",
      "Muscle relaxation",
      "Healing and recovery support",
      "Movement and rehabilitation support",
    ],
    category: "hands-on",
  },
  {
    id: "osteopathic-articulation",
    slug: "osteopathic-articulation",
    title: "Osteopathic Articulation",
    tagline: "Gentle joint mobility work",
    summary:
      "A gentle hands-on technique to improve joint mobility, reduce stiffness and restore natural movement. Often used alongside soft tissue therapy, rehabilitation or acupuncture.",
    category: "hands-on",
  },
  {
    id: "iastm-fascial-release",
    slug: "iastm-fascial-release",
    title: "IASTM / Fascial Release",
    tagline: "Instrument-assisted soft tissue mobilisation",
    summary:
      "Instrument-assisted soft tissue mobilisation and fascial release for restricted connective tissue, pain, flexibility and recovery.",
    importantNotes: [
      "Mild redness or sensitivity after treatment can be normal and usually settles quickly.",
    ],
    category: "hands-on",
  },
  {
    id: "taping",
    slug: "taping",
    title: "Taping",
    tagline: "Support for muscles, joints and ligaments",
    summary:
      "Rigid and kinesiology taping to support activity, recovery and injury prevention.",
    whoItsFor: [
      "Sprains and strains",
      "Knee, ankle and shoulder issues",
      "Back discomfort",
      "Tendonitis",
      "Posture support",
      "Injury prevention during sport or work",
    ],
    includes: ["Rigid taping", "Kinesiology taping"],
    category: "support",
  },
  {
    id: "steroid-injection",
    slug: "steroid-injection",
    title: "Steroid Injection Consultation",
    tagline: "Assessment-first injection pathway",
    summary:
      "A structured consultation pathway for patients who may be suitable for steroid injection after clinical assessment.",
    fee: "£150 steroid injection fee (consultation priced separately)",
    assessmentRequired: true,
    importantNotes: [
      "The steroid injection fee is £150. This does not include the consultation and injections cannot be booked without a prior assessment.",
      "When booking online, the patient is booking the initial consultation only.",
    ],
    benefits: [
      "May reduce local inflammation in suitable cases",
      "Can support pain relief when clinically appropriate",
      "Allows a clear plan for follow-up care",
    ],
    conditions: [
      "Suitability depends on individual assessment",
      "Not appropriate for every condition or patient",
      "Your therapist will discuss alternatives if injection is not advised",
    ],
    risks: [
      "Possible short-term discomfort at the injection site",
      "Temporary flare of symptoms",
      "Skin changes or thinning with repeated injections",
      "Infection risk (rare)",
      "Other risks will be discussed at consultation based on your health history",
    ],
    nextSteps: [
      "Book an initial consultation — not the injection itself",
      "Attend assessment to confirm suitability",
      "Injection arranged only if clinically appropriate",
    ],
    category: "injection",
  },
  {
    id: "telehealth",
    slug: "telehealth",
    title: "Telehealth Review",
    tagline: "Remote review when hands-on treatment is not required",
    summary:
      "A proposed virtual appointment for triage, rehabilitation check-ins, progress reviews, insurance reviews and follow-ups.",
    whoItsFor: [
      "Follow-up and progress reviews",
      "Rehab exercise check-ins",
      "Insurance or authorisation reviews",
      "Triage when unsure which appointment to book",
      "Situations where travel or hands-on treatment is not needed",
    ],
    importantNotes: [
      "Payment is required before the video appointment.",
      "Not a substitute for emergency care — seek urgent help for serious symptoms.",
    ],
    isProposed: true,
    category: "virtual",
  },
];

export const insuranceProviders: InsuranceProvider[] = [
  {
    id: "aviva",
    name: "Aviva",
    summary:
      "Aviva clients may be eligible for physiotherapy sessions covered under their policy.",
    eligibility:
      "Eligibility depends on your Aviva policy, claim status and authorisation.",
    paperworkSupport:
      "Tigers Eye can help manage paperwork and communication with Aviva where appropriate.",
    clientAction:
      "Please have your policy, claim and authorisation details ready before your appointment.",
    requiredDetails: [
      "Policy number",
      "Claim or authorisation reference",
      "Member name and date of birth",
      "Referral details if applicable",
      "Session limits or approval notes",
    ],
  },
  {
    id: "vitality",
    name: "Vitality",
    summary:
      "Vitality clients may be eligible for physiotherapy sessions covered under their policy.",
    eligibility:
      "Eligibility depends on your Vitality policy, claim status and authorisation.",
    paperworkSupport:
      "Tigers Eye can help manage paperwork and communication with Vitality where appropriate.",
    clientAction:
      "Please have your claim and authorisation details ready before your appointment.",
    requiredDetails: [
      "Policy or membership number",
      "Claim or authorisation reference",
      "Member name and date of birth",
      "Referral details if applicable",
      "Session limits or approval notes",
    ],
  },
  {
    id: "other",
    name: "Other insurer",
    summary:
      "Tigers Eye may be able to work with other insurers depending on your policy and authorisation.",
    eligibility:
      "Coverage varies by insurer, policy terms and pre-authorisation requirements.",
    paperworkSupport:
      "The clinic can capture the details needed for admin follow-up before treatment begins.",
    clientAction:
      "Please contact the clinic or use the insurance booking route so the required details can be captured before treatment.",
    requiredDetails: [
      "Insurer name",
      "Policy or membership number",
      "Authorisation or claim reference",
      "Member details",
      "Any referral or session limit information",
    ],
  },
];

export const insuranceLiabilityNotice =
  "Insurance coverage and session approval are determined by your insurer. Tigers Eye provides treatment in line with clinical assessment; claim outcomes remain subject to insurer terms.";

export const testimonials: Testimonial[] = [
  {
    id: "ryan-m",
    author: "Ryan M",
    location: "Dundee",
    quote:
      "No hard sell to come back. Just good old treatment at a very reasonable price and my injury is all but gone",
  },
  {
    id: "mike-m",
    author: "Mike M",
    location: "Dundee",
    quote:
      "Excellent knowledge, very welcoming. Would definitely recommend, one of the best!",
  },
  {
    id: "baxter-f",
    author: "Baxter F",
    location: "Angus",
    quote: "Awesome treatment for a knee problem. Highly recommended",
  },
];

export const navLinks: NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/locations", label: "Locations" },
  { href: "/team", label: "Team" },
  { href: "/insurance", label: "Insurance" },
  { href: "/telehealth", label: "Telehealth" },
  { href: "/contact", label: "Contact" },
];

export const bookingRoutes: {
  id: BookingRoute;
  label: string;
  description: string;
  adminNote: string;
  recommendedFor: string[];
}[] = [
  {
    id: "private",
    label: "Private / self-pay",
    description: "Book a standard appointment and pay privately at the clinic.",
    adminNote: "Creates a standard private appointment route in the Command Hub.",
    recommendedFor: ["New patients", "Sports massage", "Physiotherapy"],
  },
  {
    id: "insurance",
    label: "Insurance",
    description:
      "Book via the insurance pathway so claim details can be captured for admin follow-up.",
    adminNote: "Insurance details captured for admin follow-up.",
    recommendedFor: ["Aviva", "Vitality", "Other authorised insurers"],
  },
  {
    id: "telehealth",
    label: "Telehealth review",
    description:
      "Virtual review for follow-ups, triage or rehab check-ins where hands-on treatment is not required.",
    adminNote: "Payment and review workflow managed in the Command Hub.",
    recommendedFor: ["Follow-ups", "Rehab check-ins", "Insurance reviews"],
  },
  {
    id: "cash-by-agreement",
    label: "Cash by agreement",
    description:
      "For patients with a pre-agreed fee arrangement discussed with the clinic.",
    adminNote: "Flagged for admin confirmation before confirmation.",
    recommendedFor: ["Pre-agreed fees", "Special arrangements"],
  },
  {
    id: "external",
    label: "External / future booking",
    description:
      "Placeholder route for future integrations or room-user bookings.",
    adminNote: "Mirrors external/future module in the Command Hub.",
    recommendedFor: ["Future practitioners", "Room users", "External systems"],
  },
];

export const telehealthContent = {
  title: "Telehealth Review",
  intro:
    "A proposed virtual appointment service for patients who need professional guidance without a hands-on session.",
  suitableFor: [
    "Follow-up after an in-person appointment",
    "Rehabilitation exercise reviews",
    "Progress checks and treatment plan updates",
    "Insurance or authorisation discussions",
    "Triage when you are unsure which service to book",
  ],
  notSuitableFor: [
    "Emergency or urgent medical symptoms",
    "Conditions requiring hands-on assessment",
    "First-time complex assessments where in-person examination is needed",
  ],
  paymentNote:
    "Payment is required before your video appointment. You will receive joining details after payment is confirmed.",
  workflowNote:
    "Reviews are logged in the Tigers Eye Command Hub so George and the team can track progress and follow-up actions.",
  bookingCta: "Book a telehealth review",
};

export const contactForm = {
  title: "Send an enquiry",
  description:
    "This is a demo contact form. Submissions create an enquiry card in the Command Hub for admin follow-up.",
  fields: [
    { id: "name", label: "Your name", type: "text", required: true },
    { id: "email", label: "Email address", type: "email", required: true },
    { id: "phone", label: "Phone (optional)", type: "tel", required: false },
    {
      id: "location",
      label: "Preferred location",
      type: "select",
      required: false,
      options: ["Dundee", "Aviemore", "No preference"],
    },
    {
      id: "message",
      label: "How can we help?",
      type: "textarea",
      required: true,
    },
  ],
  submitLabel: "Send enquiry (demo)",
  successMessage:
    "Thank you — your demo enquiry has been created for admin follow-up.",
};

export const adminShell = {
  title: "Tigers Eye Command Hub",
  subtitle: "Admin demo shell connected to the public website",
  modules: [
    "Private appointments",
    "Insurance intake",
    "Telehealth reviews",
    "Enquiries",
    "External / future bookings",
  ],
};

export function getClinic(id: ClinicId): Clinic {
  const clinic = clinics.find((c) => c.id === id);
  if (!clinic) throw new Error(`Unknown clinic: ${id}`);
  return clinic;
}

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getTeamMember(id: string): TeamMember | undefined {
  return team.find((m) => m.id === id);
}
