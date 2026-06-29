"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { expenses, expenseCategories } from "@/lib/demo-data";

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="Expenses"
        subtitle="Track bills and receipts — upload is demo only, no real file storage."
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div
          className="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-cream-dark bg-white p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
        >
          <p className="text-3xl" aria-hidden>📄</p>
          <p className="mt-2 font-medium text-navy">Upload bill or receipt</p>
          <p className="mt-1 text-sm text-slate">Drag and drop — demo only, nothing is stored</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
          >
            Manual entry instead
          </button>
        </div>

        {showForm && (
          <form className="rounded-xl border border-cream-dark bg-white p-5 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <h3 className="font-semibold text-navy">Manual expense entry (demo)</h3>
            <input placeholder="Supplier" className="w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm" />
            <input placeholder="Amount (£)" type="number" className="w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm" />
            <select className="w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm">
              {expenseCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="date" className="w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm" />
            <button type="submit" className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white">
              Save expense (demo)
            </button>
          </form>
        )}
      </div>

      <CalloutBox variant="warning">
        Demo mode — uploaded files are not stored. Use manual entry for the demo workflow.
      </CalloutBox>

      <div className="mt-6 overflow-x-auto rounded-xl border border-cream-dark bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cream-dark bg-cream/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-navy">Supplier</th>
              <th className="px-4 py-3 font-semibold text-navy">Amount</th>
              <th className="px-4 py-3 font-semibold text-navy">Category</th>
              <th className="px-4 py-3 font-semibold text-navy">Date</th>
              <th className="px-4 py-3 font-semibold text-navy">Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-cream-dark last:border-0">
                <td className="px-4 py-3 font-medium">{e.supplier}</td>
                <td className="px-4 py-3">£{e.amount}</td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3">{e.date}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={e.paymentStatus}
                    variant={e.paymentStatus === "pending" ? "warning" : "success"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
