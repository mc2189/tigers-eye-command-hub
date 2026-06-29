import { Suspense } from "react";
import { StaffLoginForm } from "@/components/admin/StaffLoginForm";

export default function AdminLoginPage() {
  return (
    <>
      <h1 className="sr-only">Tigers Eye Command Hub — demo staff login</h1>
      <Suspense fallback={<p className="p-8 text-center text-slate">Loading…</p>}>
        <StaffLoginForm />
      </Suspense>
    </>
  );
}
