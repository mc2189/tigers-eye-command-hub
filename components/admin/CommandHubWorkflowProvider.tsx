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
} from "@/lib/command-hub-workflow-types";

export const COMMAND_HUB_WORKFLOW_CHANGED = "command-hub-workflow-changed";

interface CommandHubWorkflowContextValue {
  store: CommandHubWorkflowStore | null;
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

async function fetchStore(): Promise<CommandHubWorkflowStore> {
  const res = await fetch("/api/command-hub/workflow-state", { cache: "no-store" });
  const json = await res.json();
  if (!json.ok || !json.store) {
    throw new Error(json.message ?? "Could not load workflow state.");
  }
  return json.store as CommandHubWorkflowStore;
}

async function patchStore(body: Record<string, unknown>): Promise<CommandHubWorkflowStore> {
  const res = await fetch("/api/command-hub/workflow-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok || !json.store) {
    throw new Error(json.message ?? "Workflow state update failed.");
  }
  return json.store as CommandHubWorkflowStore;
}

export function CommandHubWorkflowProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<CommandHubWorkflowStore | null>(null);
  const [loading, setLoading] = useState(true);

  const applyStore = useCallback((next: CommandHubWorkflowStore) => {
    setStore(next);
    window.dispatchEvent(new CustomEvent(COMMAND_HUB_WORKFLOW_CHANGED));
  }, []);

  const reload = useCallback(async () => {
    const next = await fetchStore();
    applyStore(next);
  }, [applyStore]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        let next = await fetchStore();
        const legacy = collectLegacyBrowserWorkflowState();
        if (legacy && isWorkflowStoreEmptyForMigration(next)) {
          next = await patchStore({ migrateFromBrowser: legacy });
          clearLegacyBrowserWorkflowState();
        }
        if (!cancelled) applyStore(next);
      } catch {
        if (!cancelled) {
          applyStore({
            version: 1,
            updatedAt: new Date().toISOString(),
            demoWeekPreview: true,
            appointments: {},
            patients: {},
            insuranceCases: {},
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
  }, [applyStore]);

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
        }),
        appointments: {
          ...(store?.appointments ?? {}),
          [appointmentId]: { ...(store?.appointments[appointmentId] ?? {}), ...patch },
        },
      };
      applyStore(optimistic);
      const next = await patchStore({ appointmentId, appointmentPatch: patch });
      applyStore(next);
      return next.appointments[appointmentId] ?? {};
    },
    [store, applyStore]
  );

  const setDemoWeekPreview = useCallback(
    async (active: boolean) => {
      if (store) applyStore({ ...store, demoWeekPreview: active });
      const next = await patchStore({ demoWeekPreview: active });
      applyStore(next);
    },
    [store, applyStore]
  );

  const saveInsuranceCase = useCallback(
    async (detail: DemoInsuranceCaseDetail) => {
      const next = await patchStore({ insuranceCase: detail });
      applyStore(next);
    },
    [applyStore]
  );

  const resetInsuranceCases = useCallback(async () => {
    const next = await patchStore({ resetInsuranceCases: true });
    applyStore(next);
  }, [applyStore]);

  const value = useMemo<CommandHubWorkflowContextValue>(
    () => ({
      store,
      loading,
      demoWeekPreview: store?.demoWeekPreview ?? true,
      insuranceCases: store?.insuranceCases ?? {},
      getAppointmentState: (appointmentId: string) =>
        store?.appointments[appointmentId] ?? {},
      updateAppointmentState,
      setDemoWeekPreview,
      saveInsuranceCase,
      resetInsuranceCases,
      reload,
    }),
    [
      store,
      loading,
      updateAppointmentState,
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
