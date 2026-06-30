"use client";

import { useEffect, useState } from "react";
import { TreatmentNoteSafetyProofPanel } from "@/components/admin/TreatmentNoteSafetyProofPanel";

export function TreatmentNoteSafetyProofPanelLoader() {
  const [writesEnabled, setWritesEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/cliniko/status")
      .then((r) => r.json())
      .then((json: { writesEnabled?: boolean }) => setWritesEnabled(Boolean(json.writesEnabled)))
      .catch(() => setWritesEnabled(false));
  }, []);

  return <TreatmentNoteSafetyProofPanel writesEnabled={writesEnabled} />;
}
