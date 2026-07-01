import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  DEFAULT_DEMO_INSURANCE_CASES,
  isDemoPatientLabel,
  type DemoInsuranceCaseDetail,
} from "@/lib/demo-insurance-cases";
import type {
  AppointmentRecordState,
  CommandHubWorkflowStore,
  WorkflowStatePatch,
} from "@/lib/command-hub-workflow-types";

const STORE_VERSION = 1 as const;

function defaultStore(): CommandHubWorkflowStore {
  return {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    demoWeekPreview: true,
    appointments: {},
    patients: {},
    insuranceCases: Object.fromEntries(
      DEFAULT_DEMO_INSURANCE_CASES.map((c) => [c.patientLabel, c])
    ),
  };
}

function normalizeStore(raw: unknown): CommandHubWorkflowStore {
  const base = defaultStore();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Partial<CommandHubWorkflowStore>;
  return {
    version: STORE_VERSION,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : base.updatedAt,
    demoWeekPreview:
      typeof obj.demoWeekPreview === "boolean" ? obj.demoWeekPreview : base.demoWeekPreview,
    appointments:
      obj.appointments && typeof obj.appointments === "object" ? obj.appointments : {},
    patients: obj.patients && typeof obj.patients === "object" ? obj.patients : {},
    insuranceCases: sanitizeInsuranceCases(obj.insuranceCases) ?? base.insuranceCases,
  };
}

function sanitizeInsuranceCases(
  raw: unknown
): Record<string, DemoInsuranceCaseDetail> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, DemoInsuranceCaseDetail> = {};
  for (const [key, value] of Object.entries(raw as Record<string, DemoInsuranceCaseDetail>)) {
    if (!isDemoPatientLabel(key) || !value?.patientLabel) continue;
    if (!isDemoPatientLabel(value.patientLabel)) continue;
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

async function resolveStorePath(): Promise<string> {
  if (process.env.COMMAND_HUB_WORKFLOW_STATE_PATH?.trim()) {
    return process.env.COMMAND_HUB_WORKFLOW_STATE_PATH.trim();
  }
  const dataPath = path.join(process.cwd(), ".data", "command-hub-workflow.json");
  try {
    await mkdir(path.dirname(dataPath), { recursive: true });
    return dataPath;
  } catch {
    return path.join("/tmp", "tigers-eye-command-hub-workflow.json");
  }
}

export async function readCommandHubWorkflowStore(): Promise<CommandHubWorkflowStore> {
  const filePath = await resolveStorePath();
  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return defaultStore();
  }
}

async function writeCommandHubWorkflowStore(store: CommandHubWorkflowStore): Promise<void> {
  const filePath = await resolveStorePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const next: CommandHubWorkflowStore = {
    ...store,
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(filePath, JSON.stringify(next, null, 2), "utf8");
}

export async function patchCommandHubWorkflowStore(
  patch: WorkflowStatePatch
): Promise<CommandHubWorkflowStore> {
  const current = await readCommandHubWorkflowStore();
  let next: CommandHubWorkflowStore = { ...current };

  if (patch.migrateFromBrowser) {
    const m = patch.migrateFromBrowser;
    next = {
      ...next,
      demoWeekPreview:
        typeof m.demoWeekPreview === "boolean" ? m.demoWeekPreview : next.demoWeekPreview,
      appointments: { ...next.appointments, ...(m.appointments ?? {}) },
      patients: { ...next.patients, ...(m.patients ?? {}) },
      insuranceCases: {
        ...next.insuranceCases,
        ...(sanitizeInsuranceCases(m.insuranceCases) ?? {}),
      },
    };
  }

  if (typeof patch.demoWeekPreview === "boolean") {
    next.demoWeekPreview = patch.demoWeekPreview;
  }

  if (patch.appointmentId && patch.appointmentPatch) {
    const id = patch.appointmentId;
    next.appointments = {
      ...next.appointments,
      [id]: { ...(next.appointments[id] ?? {}), ...patch.appointmentPatch },
    };
  }

  if (patch.insuranceCase) {
    if (!isDemoPatientLabel(patch.insuranceCase.patientLabel)) {
      throw new Error("Blocked for safety — insurance case must use DEMO patient label.");
    }
    next.insuranceCases = {
      ...next.insuranceCases,
      [patch.insuranceCase.patientLabel]: patch.insuranceCase,
    };
  }

  if (patch.resetInsuranceCases) {
    next.insuranceCases = Object.fromEntries(
      DEFAULT_DEMO_INSURANCE_CASES.map((c) => [c.patientLabel, c])
    );
  }

  await writeCommandHubWorkflowStore(next);
  return next;
}

export function getAppointmentStateFromStore(
  store: CommandHubWorkflowStore,
  appointmentId: string
): AppointmentRecordState {
  return store.appointments[appointmentId] ?? {};
}
