import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { apiClient } from "../../lib/apiClient";
import {
  fetchPaymentPlans,
  createPaymentPlan,
  updatePaymentPlan,
  deletePaymentPlan,
  clearMutationError,
} from "./paymentPlanSlice";
import type { Currency, CreatePaymentPlanPayload, PaymentPlan } from "./paymentPlanTypes";
import type { ApiResponse } from "../common/ApiResponse";

const DURATION_COLORS = [
  { dot: "bg-accent", chip: "bg-accent-soft text-accent" },
  { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-600" },
  { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-600" },
  { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-600" },
  { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-600" },
];

const PAGE_SIZE = 20;

const emptyForm: CreatePaymentPlanPayload = {
  name: "",
  description: "",
  durationMonths: 1,
  basePrice: 0,
  baseCurrencyId: "",
  isActive: true,
};

function extractCurrencyList(payload: unknown): Currency[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const value of [record.data, record.currencies, record.items, record.results]) {
    if (Array.isArray(value)) return value as Currency[];
  }

  return [];
}

export function PlansPage() {
  const dispatch = useAppDispatch();
  const { plans, status, error, mutationStatus, mutationError } = useAppSelector((state) => state.paymentPlans);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePaymentPlanPayload>(emptyForm);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchPaymentPlans());
    apiClient
      .get<ApiResponse<Currency[]> | Currency[]>("/currencies")
      .then(({ data }) => setCurrencies(extractCurrencyList(data)))
      .catch(() => setCurrencies([]));
  }, [dispatch]);

  const isLoading = status === "loading" && plans.length === 0;
  const hasError = status === "failed" && plans.length === 0;

  const activeCount = useMemo(() => plans.filter((p) => p.isActive).length, [plans]);
  const avgPrice = useMemo(
    () => (plans.length ? plans.reduce((sum, p) => sum + Number(p.basePrice), 0) / plans.length : 0),
    [plans],
  );

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => p.name.toLowerCase().includes(q));
  }, [plans, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE));

  // Clamp the current page if the list shrinks (e.g. after a delete) past the current page's range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Reset to page 1 whenever the search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPlans.slice(start, start + PAGE_SIZE);
  }, [filteredPlans, currentPage]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    dispatch(clearMutationError());
    setIsModalOpen(true);
  }

  function openEditModal(plan: PaymentPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description,
      durationMonths: plan.durationMonths,
      basePrice: Number(plan.basePrice),
      baseCurrencyId: plan.baseCurrencyId,
      isActive: plan.isActive,
    });
    dispatch(clearMutationError());
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const action = editingId
      ? await dispatch(updatePaymentPlan({ id: editingId, dto: form }))
      : await dispatch(createPaymentPlan(form));

    if (action.meta.requestStatus === "fulfilled") {
      setIsModalOpen(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    await dispatch(deletePaymentPlan(pendingDeleteId));
    setPendingDeleteId(null);
  }

  return (
    <>
      {hasError && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 shadow-sm">
          <span>{error}</span>
          <button
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            onClick={() => dispatch(fetchPaymentPlans())}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Plans list */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-900">Payment Plans</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-400">Manage subscription tiers and pricing</p>
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-accent/30 transition-transform hover:scale-[1.03]"
            >
              + New Plan
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-gray-400" aria-hidden>
              🔍
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by plan name…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No plans yet</span>
              <span className="text-xs text-gray-400">Create your first payment plan to get started.</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No matches for "{searchQuery}"</span>
              <span className="text-xs text-gray-400">Try a different plan name.</span>
            </div>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {paginatedPlans.map((plan, i) => {
                  const palette = DURATION_COLORS[i % DURATION_COLORS.length];
                  return (
                    <li
                      key={plan.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-gray-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full ${palette.dot}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                plan.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="m-0 mt-0.5 max-w-md text-xs text-gray-400">{plan.description}</p>
                          <span
                            className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${palette.chip}`}
                          >
                            {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className="text-sm font-bold text-gray-900">
                          {Number(plan.basePrice).toLocaleString()} {plan.baseCurrency?.code ?? ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(plan)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(plan.id)}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredPlans.length)} of {filteredPlans.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                          page === currentPage
                            ? "bg-accent text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <h2 className="m-0 mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">📊</span> Plan Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <SummaryStat icon="📦" label="Total Plans" value={plans.length} loading={isLoading} />
              <SummaryStat icon="✅" label="Active" value={activeCount} loading={isLoading} />
              <SummaryStat
                icon="💰"
                label="Avg. Price"
                value={isLoading ? undefined : Math.round(avgPrice)}
                loading={isLoading}
              />
              <SummaryStat icon="⏸️" label="Inactive" value={plans.length - activeCount} loading={isLoading} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-lg shadow-slate-900/5">
            <div>
              <p className="m-0 text-base font-semibold text-gray-900">Need a hand? 👋</p>
              <p className="m-0 mt-0.5 text-sm text-gray-400">Plans sync instantly for all users.</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              💳
            </div>
          </div>
        </div>
      </div>

      {/* ===== Create / Edit modal ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="m-0 text-base font-semibold text-gray-900">{editingId ? "Edit Plan" : "New Plan"}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {mutationError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {mutationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <Field label="Description">
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (months)">
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.durationMonths}
                    onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </Field>

                <Field label="Base Price">
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </Field>
              </div>

              <Field label="Base Currency">
                <select
                  required
                  value={form.baseCurrencyId}
                  onChange={(e) => setForm({ ...form, baseCurrencyId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    Select currency…
                  </option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                Active
              </label>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutationStatus === "loading"}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 disabled:opacity-50"
                >
                  {mutationStatus === "loading" ? "Saving…" : editingId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete confirm ===== */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="m-0 text-base font-semibold text-gray-900">Delete this plan?</h3>
            <p className="mt-2 text-sm text-gray-500">This action can&apos;t be undone.</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900">
          {loading ? (
            <span className="inline-block h-4 w-10 animate-pulse rounded bg-gray-100" />
          ) : (
            (value ?? 0).toLocaleString()
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-500">
      {label}
      {children}
    </label>
  );
}
