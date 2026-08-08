import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { apiClient } from "../../lib/apiClient";
import { fetchCurrencies, createCurrency, updateCurrency, deleteCurrency, clearMutationError } from "./currencySlice";
import type { CreateCurrencyPayload, Currency, ConvertResult } from "./currencyTypes";

const CODE_COLORS = [
  { dot: "bg-accent" },
  { dot: "bg-violet-500" },
  { dot: "bg-emerald-500" },
  { dot: "bg-amber-500" },
  { dot: "bg-rose-500" },
];

const PAGE_SIZE = 10;

const emptyForm: CreateCurrencyPayload = {
  code: "",
  name: "",
  isActive: true,
};

export function CurrencyPage() {
  const dispatch = useAppDispatch();
  const { currencies, status, error, mutationStatus, mutationError } = useAppSelector((state) => state.currencies);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCurrencyPayload>(emptyForm);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick converter widget
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState(1);
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const isLoading = status === "loading" && currencies.length === 0;
  const hasError = status === "failed" && currencies.length === 0;

  const activeCount = useMemo(() => currencies.filter((c) => c.isActive).length, [currencies]);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return currencies;
    return currencies.filter((c) => c.code.toUpperCase().includes(q));
  }, [currencies, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCurrencies.length / PAGE_SIZE));

  // Clamp the current page if the list shrinks (e.g. after a delete) past the current page's range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Reset to page 1 whenever the search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedCurrencies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCurrencies.slice(start, start + PAGE_SIZE);
  }, [filteredCurrencies, currentPage]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    dispatch(clearMutationError());
    setIsModalOpen(true);
  }

  function openEditModal(currency: Currency) {
    setEditingId(currency.id);
    setForm({ code: currency.code, name: currency.name, isActive: currency.isActive });
    dispatch(clearMutationError());
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, code: form.code.toUpperCase() };
    const action = editingId
      ? await dispatch(updateCurrency({ id: editingId, dto: payload }))
      : await dispatch(createCurrency(payload));

    if (action.meta.requestStatus === "fulfilled") {
      setIsModalOpen(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    await dispatch(deleteCurrency(pendingDeleteId));
    setPendingDeleteId(null);
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId) return;
    setIsConverting(true);
    setConvertError(null);
    setConvertResult(null);
    try {
      const { data } = await apiClient.get<ConvertResult>("/currencies/convert", {
        params: { amount, fromCurrencyId: fromId, toCurrencyId: toId },
      });
      setConvertResult(data);
    } catch (err: any) {
      setConvertError(err?.response?.data?.message ?? "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <>
      {hasError && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 shadow-sm">
          <span>{error}</span>
          <button
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            onClick={() => dispatch(fetchCurrencies())}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Currencies list */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-900">Currencies</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-400">Manage supported currencies and codes</p>
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 transition-transform hover:scale-[1.03]"
            >
              + New Currency
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-gray-400" aria-hidden>
              🔍
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. USD)…"
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : currencies.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No currencies yet</span>
              <span className="text-xs text-gray-400">Add one, or check that seeding ran on boot.</span>
            </div>
          ) : filteredCurrencies.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No matches for "{searchQuery}"</span>
              <span className="text-xs text-gray-400">Try a different currency code.</span>
            </div>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {paginatedCurrencies.map((currency, i) => {
                  const palette = CODE_COLORS[i % CODE_COLORS.length];
                  return (
                    <li
                      key={currency.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-gray-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${palette.dot}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{currency.code}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                currency.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {currency.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="m-0 mt-0.5 text-xs text-gray-400">{currency.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => openEditModal(currency)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(currency.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredCurrencies.length)} of {filteredCurrencies.length}
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
                            ? "bg-accent text-green"
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

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <h2 className="m-0 mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">📊</span> Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <SummaryStat icon="🌐" label="Total" value={currencies.length} loading={isLoading} />
              <SummaryStat icon="✅" label="Active" value={activeCount} loading={isLoading} />
              <SummaryStat icon="⏸️" label="Inactive" value={currencies.length - activeCount} loading={isLoading} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <h2 className="m-0 mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">🔁</span> Quick Convert
            </h2>
            <form onSubmit={handleConvert} className="flex flex-col gap-3">
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Amount"
              />
              <select
                required
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="" disabled>
                  From…
                </option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
              <select
                required
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="" disabled>
                  To…
                </option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isConverting}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 disabled:opacity-50"
              >
                {isConverting ? "Converting…" : "Convert"}
              </button>
            </form>

            {convertError && <p className="mt-3 text-xs text-rose-600">{convertError}</p>}

            {convertResult && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-accent-soft to-transparent px-4 py-3">
                <div className="text-sm font-semibold text-gray-900">
                  {convertResult.convertedAmount.toLocaleString()} {convertResult.to.code}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  Rate: 1 {convertResult.from.code} = {convertResult.rate} {convertResult.to.code} ·{" "}
                  {convertResult.date}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Create / Edit modal ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="m-0 text-base font-semibold text-gray-900">
                {editingId ? "Edit Currency" : "New Currency"}
              </h3>
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
              <Field label="Code (ISO, e.g. USD)">
                <input
                  required
                  maxLength={3}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase outline-none focus:border-accent"
                />
              </Field>

              <Field label="Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
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
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-accent/30 disabled:opacity-50"
                >
                  {mutationStatus === "loading" ? "Saving…" : editingId ? "Save Changes" : "Create Currency"}
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
            <h3 className="m-0 text-base font-semibold text-gray-900">Delete this currency?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Plans priced in this currency may break. This action can&apos;t be undone.
            </p>
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
