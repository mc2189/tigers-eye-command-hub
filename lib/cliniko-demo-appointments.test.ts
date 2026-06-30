import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSafeDemoPatientLabel,
  isBrokenAbbreviatedDemoLabel,
} from "./cliniko-demo-appointments.ts";

describe("isBrokenAbbreviatedDemoLabel", () => {
  it("flags abbreviated broken labels", () => {
    assert.equal(isBrokenAbbreviatedDemoLabel("DEMO 0."), true);
    assert.equal(isBrokenAbbreviatedDemoLabel("DEMO (."), true);
    assert.equal(isBrokenAbbreviatedDemoLabel("DEMO Test Patient 001"), false);
  });
});

describe("getSafeDemoPatientLabel", () => {
  const patients = new Map([
    ["1", { firstName: "DEMO Test", lastName: "Patient 001" }],
  ]);

  it("prefers full DEMO patient_name", () => {
    assert.equal(
      getSafeDemoPatientLabel({ patientName: "DEMO Test Patient 001" }),
      "DEMO Test Patient 001"
    );
  });

  it("handles updated suffix in full name", () => {
    assert.equal(
      getSafeDemoPatientLabel({ patientName: "DEMO Test Patient 001 (updated)" }),
      "DEMO Test Patient 001 (updated)"
    );
  });

  it("rejects broken abbreviated labels", () => {
    assert.equal(getSafeDemoPatientLabel({ patientLabel: "DEMO 0." }), "DEMO patient");
    assert.equal(getSafeDemoPatientLabel({ patientLabel: "DEMO (." }), "DEMO patient");
  });

  it("resolves linked DEMO patient by id", () => {
    assert.equal(
      getSafeDemoPatientLabel({ patientId: "1" }, patients),
      "DEMO Test Patient 001"
    );
  });

  it("falls back safely for empty or unknown", () => {
    assert.equal(getSafeDemoPatientLabel({}), "DEMO patient");
    assert.equal(getSafeDemoPatientLabel({ patientName: "Jane Smith" }), "Cliniko patient");
  });
});
