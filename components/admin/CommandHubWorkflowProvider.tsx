"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import {
  clearLegacyBrowserWorkflowState,
  collectLegacyBrowserWorkflowState,
  isWorkflowStoreEmptyForMigration,
} from "@/lib/command-hub-workflow-migrate";
import type {
  AppointmentRecordState,
  CommandHubWorkflowStore,
  InvoiceDraftWorkflowState,
} from "@/lib/command-hub-workflow-types";
import type {
  WorkflowMigrationStatus,
  WorkflowStorageInfo,
} from "@/lib/workflow-storage/types";

export const COMMAND_HUB_WORKFLOW_CHANGED = "command-hub-workflow-changed";

interface WorkflowApiResponse {
  ok: boolean;
  store?: CommandHubWorkflowStore;
  storage?: WorkflowStorageInfo;
  message?: string;
}

interface CommandHubWorkflowContextValue {
  store: CommandHubWorkflowStore | null;
  storage: WorkflowStorageInfo | null;
  migration: WorkflowMigrationStatus | null;
  loading: boolean;
  demoWeekPreview: boolean;
  insuranceCases: Record<string, DemoInsuranceCaseDetail>;
  getAppointmentState: (appointmentId: string) => AppointmentRecordState;
  updateAppointmentState: (
    appointmentId: string,
    patch: Partial<AppointmentRecordState>
  ) => Promise<AppointmentRecordState>;
  setDemoWeekPreview: (active: boolean) => Promise<void>;
  saveInsuranceCase: (detail: DemoInsuranceCaseDetail) => Promise<void>;
  resetInsuranceCases: () => Promise<void>;
  getInvoiceDraftState: (invoiceDraftId: string) => InvoiceDraftWorkflowState;
  updateInvoiceDraftState: (
    invoiceDraftId: string,
    patch: Partial<InvoiceDraftWorkflowState>
  ) => Promise<InvoiceDraftWorkflowState>;
  reload: () => Promise<void>;
}

const CommandHubWorkflowContext = createContext<CommandHubWorkflowContextValue | null>(null);

export function useCommandHubWorkflow(): CommandHubWorkflowContextValue {
  const ctx = useContext(CommandHubWorkflowContext);
  if (!ctx) {
    throw new Error("useCommandHubWorkflow must be used within CommandHubWorkflowProvider");
  }
  return ctx;
}

/** Optional hook — returns null outside provider (e.g. tests). */
export function useCommandHubWorkflowOptional(): CommandHubWorkflowContextValue | null {
  return useContext(CommandHubWorkflowContext);
}

async function fetchWorkflow(): Promise<WorkflowApiResponse> {
  const res = await fetch("/api/command-hub/workflow-state", { cache: "no-store" });
  return (await res.json()) as WorkflowApiResponse;
}

async function patchWorkflow(body: Record<string, unknown>): Promise<WorkflowApiResponse> {
  const res = await fetch("/api/command-hub/workflow-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as WorkflowApiResponse;
}

function emptyMigration(): WorkflowMigrationStatus {
  return {
    attempted: false,
    migrated: false,
    source: "none",
    message: "No legacy browser workflow state found.",
  };
}

export function CommandHubWorkflowProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<CommandHubWorkflowStore | null>(null);
  const [storage, setStorage] = useState<WorkflowStorageInfo | null>(null);
  const [migration, setMigration] = useState<WorkflowMigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const applyResponse = useCallback((json: WorkflowApiResponse) => {
    if (json.store) setStore(json.store);
    if (json.storage) setStorage(json.storage);
    window.dispatchEvent(new CustomEvent(COMMAND_HUB_WORKFLOW_CHANGED));
  }, []);

  const reload = useCallback(async () => {
    const json = await fetchWorkflow();
    if (!json.ok || !json.store) {
      throw new Error(json.message ?? "Could not load workflow state.");
    }
    applyResponse(json);
  }, [applyResponse]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const initial = await fetchWorkflow();
        if (!initial.ok || !initial.store) {
          throw new Error(initial.message ?? "Could not load workflow state.");
        }

        let nextStore = initial.store;
        let nextStorage = initial.storage ?? null;
        let migrationStatus = emptyMigration();

        const legacy = collectLegacyBrowserWorkflowState();
        migrationStatus = {
          attempted: true,
          migrated: false,
          source: legacy ? "legacy-localStorage" : "none",
          message: legacy
            ? "Legacy browser workflow state detected."
            : "No legacy browser workflow state found.",
        };

        if (legacy && isWorkflowStoreEmptyForMigration(nextStore)) {
          const migrated = await patchWorkflow({ migrateFromBrowser: legacy });
          if (!migrated.ok || !migrated.store) {
            throw new Error(migrated.message ?? "Legacy workflow migration failed.");
          }
          nextStore = migrated.store;
          nextStorage = migrated.storage ?? nextStorage;
          clearLegacyBrowserWorkflowState();
          migrationStatus = {
            attempted: true,
            migrated: true,
            source: "legacy-localStorage",
            message: "Legacy browser workflow state migrated to server store.",
          };
        }

        if (!cancelled) {
          setStore(nextStore);
          setStorage(nextStorage);
          setMigration(migrationStatus);
          window.dispatchEvent(new CustomEvent(COMMAND_HUB_WORKFLOW_CHANGED));
        }
      } catch {
        if (!cancelled) {
          setStore({
            version: 1,
            updatedAt: new Date().toISOString(),
            demoWeekPreview: true,
            appointments: {},
            patients: {},
            insuranceCases: {},
            invoiceDrafts: {},
          });
          setMigration({
            attempted: true,
            migrated: false,
            source: "none",
            message: "Workflow bootstrap failed — using in-memory defaults until reload.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateAppointmentState = useCallback(
    async (appointmentId: string, patch: Partial<AppointmentRecordState>) => {
      const optimistic: CommandHubWorkflowStore = {
        ...(store ?? {
          version: 1,
          updatedAt: new Date().toISOString(),
          demoWeekPreview: true,
          appointments: {},
          patients: {},
          insuranceCases: {},
          invoiceDrafts: {},
        }),
        appointments: {
          ...(store?.appointments ?? {}),
          [appointmentId]: { ...(store?.appointments[appointmentId] ?? {}), ...patch },
        },
      };
      setStore(optimistic);
      const json = await patchWorkflow({ appointmentId, appointmentPatch: patch });
      if (!json.ok || !json.store) {
        throw new Error(json.message ?? "Workflow state update failed.");
      }
      applyResponse(json);
      return json.store.appointments[appointmentId] ?? {};
    },
    [store, applyResponse]
  );

  const setDemoWeekPreview = useCallback(
    async (active: boolean) => {
      if (store) setStore({ ...store, demoWeekPreview: active });
      const json = await patchWorkflow({ demoWeekPreview: active });
      if (!json.ok || !json.store) {
        throw new Error(json.message ?? "Workflow state update failed.");
      }
      applyResponse(json);
    },
    [store, applyResponse]
  );

  const saveInsuranceCase = useCallback(
    async (detail: DemoInsuranceCaseDetail) => {
      const json = await patchWorkflow({ insuranceCase: detail });
      if (!json.ok || !json.store) {
        throw new Error(json.message ?? "Workflow state update failed.");
      }
      applyResponse(json);
    },
    [applyResponse]
  );

  const resetInsuranceCases = useCallback(async () => {
    const json = await patchWorkflow({ resetInsuranceCases: true });
    if (!json.ok || !json.store) {
      throw new Error(json.message ?? "Workflow state update failed.");
    }
    applyResponse(json);
  }, [applyResponse]);

  const updateInvoiceDraftState = useCallback(
    async (invoiceDraftId: string, patch: Partial<InvoiceDraftWorkflowState>) => {
      const optimistic: CommandHubWorkflowStore = {
        ...(store ?? {
          version: 1,
          updatedAt: new Date().toISOString(),
          demoWeekPreview: true,
          appointments: {},
          patients: {},
          insuranceCases: {},
          invoiceDrafts: {},
        }),
        invoiceDrafts: {
          ...(store?.invoiceDrafts ?? {}),
          [invoiceDraftId]: { ...(store?.invoiceDrafts[invoiceDraftId] ?? {}), ...patch },
        },
      };
      setStore(optimistic);
      const json = await patchWorkflow({ invoiceDraftId, invoiceDraftPatch: patch });
      if (!json.ok || !json.store) {
        throw new Error(json.message ?? "Workflow state update failed.");
      }
      applyResponse(json);
      return json.store.invoiceDrafts[invoiceDraftId] ?? {};
    },
    [store, applyResponse]
  );

  const value = useMemo<CommandHubWorkflowContextValue>(
    () => ({
      store,
      storage,
      migration,
      loading,
      demoWeekPreview: store?.demoWeekPreview ?? true,
      insuranceCases: store?.insuranceCases ?? {},
      getAppointmentState: (appointmentId: string) =>
        store?.appointments[appointmentId] ?? {},
      getInvoiceDraftState: (invoiceDraftId: string) =>
        store?.invoiceDrafts?.[invoiceDraftId] ?? {},
      updateAppointmentState,
      updateInvoiceDraftState,
      setDemoWeekPreview,
      saveInsuranceCase,
      resetInsuranceCases,
      reload,
    }),
    [
      store,
      storage,
      migration,
      loading,
      updateAppointmentState,
      updateInvoiceDraftState,
      setDemoWeekPreview,
      saveInsuranceCase,
      resetInsuranceCases,
      reload,
    ]
  );

  return (
    <CommandHubWorkflowContext.Provider value={value}>
      {children}
    </CommandHubWorkflowContext.Provider>
  );
}
