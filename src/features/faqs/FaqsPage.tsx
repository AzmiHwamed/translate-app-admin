import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchFaqCategories,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  clearCategoryMutationError,
  fetchFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  clearFaqMutationError,
} from "./faqSlice";
import type { Faq, FaqCategory, CreateFaqPayload, CreateFaqCategoryPayload } from "./faqTypes";

const CATEGORY_DOTS = ["bg-accent", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

const PAGE_SIZE = 10;

const emptyFaqForm: CreateFaqPayload = {
  question: "",
  answer: "",
  categoryId: "",
  order: 0,
  isActive: true,
};

const emptyCategoryForm: CreateFaqCategoryPayload = {
  name: "",
  description: "",
  order: 0,
  isActive: true,
};

export function FaqsPage() {
  const dispatch = useAppDispatch();
  const {
    categories,
    categoriesStatus,
    categoriesError,
    categoryMutationStatus,
    categoryMutationError,
    faqs,
    faqsStatus,
    faqsError,
    faqMutationStatus,
    faqMutationError,
  } = useAppSelector((state) => state.faqs);

  // Category filter/selection for the FAQ list
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // FAQ modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<CreateFaqPayload>(emptyFaqForm);
  const [pendingDeleteFaqId, setPendingDeleteFaqId] = useState<string | null>(null);

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateFaqCategoryPayload>(emptyCategoryForm);
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFaqCategories());
    dispatch(fetchFaqs(undefined));
  }, [dispatch]);

  const isLoadingFaqs = faqsStatus === "loading" && faqs.length === 0;
  const hasFaqsError = faqsStatus === "failed" && faqs.length === 0;
  const isLoadingCategories = categoriesStatus === "loading" && categories.length === 0;

  const activeFaqCount = useMemo(() => faqs.filter((f) => f.isActive).length, [faqs]);

  const filteredFaqs = useMemo(() => {
    let list = faqs;
    if (activeCategoryId !== "all") {
      list = list.filter((f) => f.categoryId === activeCategoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => f.question.toLowerCase().includes(q));
    }
    return list;
  }, [faqs, activeCategoryId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategoryId]);

  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFaqs.slice(start, start + PAGE_SIZE);
  }, [filteredFaqs, currentPage]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function categoryName(categoryId?: string | null) {
    if (!categoryId) return "Uncategorized";
    return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  }

  // ── FAQ modal handlers ──────────────────────

  function openCreateFaqModal() {
    setEditingFaqId(null);
    setFaqForm({
      ...emptyFaqForm,
      categoryId: activeCategoryId === "all" ? "" : activeCategoryId,
    });
    dispatch(clearFaqMutationError());
    setIsFaqModalOpen(true);
  }

  function openEditFaqModal(faq: Faq) {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      categoryId: faq.categoryId ?? "",
      order: faq.order,
      isActive: faq.isActive,
    });
    dispatch(clearFaqMutationError());
    setIsFaqModalOpen(true);
  }

  async function handleFaqSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dto: CreateFaqPayload = {
      ...faqForm,
      categoryId: faqForm.categoryId || undefined,
    };
    const action = editingFaqId
      ? await dispatch(updateFaq({ id: editingFaqId, dto }))
      : await dispatch(createFaq(dto));

    if (action.meta.requestStatus === "fulfilled") {
      setIsFaqModalOpen(false);
    }
  }

  async function handleConfirmDeleteFaq() {
    if (!pendingDeleteFaqId) return;
    await dispatch(deleteFaq(pendingDeleteFaqId));
    setPendingDeleteFaqId(null);
  }

  // ── Category modal handlers ─────────────────

  function openCreateCategoryModal() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    dispatch(clearCategoryMutationError());
    setIsCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: FaqCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      order: category.order,
      isActive: category.isActive,
    });
    dispatch(clearCategoryMutationError());
    setIsCategoryModalOpen(true);
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    const action = editingCategoryId
      ? await dispatch(updateFaqCategory({ categoryId: editingCategoryId, dto: categoryForm }))
      : await dispatch(createFaqCategory(categoryForm));

    if (action.meta.requestStatus === "fulfilled") {
      setIsCategoryModalOpen(false);
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!pendingDeleteCategoryId) return;
    if (activeCategoryId === pendingDeleteCategoryId) setActiveCategoryId("all");
    await dispatch(deleteFaqCategory(pendingDeleteCategoryId));
    setPendingDeleteCategoryId(null);
  }

  return (
    <>
      {hasFaqsError && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 shadow-sm">
          <span>{faqsError}</span>
          <button
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            onClick={() => dispatch(fetchFaqs(activeCategoryId === "all" ? undefined : activeCategoryId))}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* FAQ list */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-900">FAQs</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-400">Manage questions, answers, and categories</p>
            </div>
            <button
              onClick={openCreateFaqModal}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 transition-transform hover:scale-[1.03]"
            >
              + New FAQ
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-gray-400" aria-hidden>
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by question…"
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

            <select
              value={activeCategoryId}
              onChange={(e) => setActiveCategoryId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 outline-none focus:border-accent sm:w-48"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {isLoadingFaqs ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No FAQs yet</span>
              <span className="text-xs text-gray-400">Create your first FAQ to get started.</span>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
              <span className="text-sm font-medium text-gray-500">No matches</span>
              <span className="text-xs text-gray-400">Try a different search or category.</span>
            </div>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {paginatedFaqs.map((faq) => (
                  <li
                    key={faq.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-gray-200 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            faq.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {faq.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="m-0 mt-0.5 max-w-lg text-xs text-gray-400 line-clamp-2">{faq.answer}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                        {categoryName(faq.categoryId)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
                      <button
                        onClick={() => openEditFaqModal(faq)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDeleteFaqId(faq.id)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredFaqs.length)} of {filteredFaqs.length}
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
                            ? "bg-accent text-black"
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

        {/* Sidebar: categories + summary */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <h2 className="m-0 mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">📊</span> FAQ Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <SummaryStat icon="❓" label="Total FAQs" value={faqs.length} loading={isLoadingFaqs} />
              <SummaryStat icon="✅" label="Active" value={activeFaqCount} loading={isLoadingFaqs} />
              <SummaryStat icon="⏸️" label="Inactive" value={faqs.length - activeFaqCount} loading={isLoadingFaqs} />
              <SummaryStat icon="🗂️" label="Categories" value={categories.length} loading={isLoadingCategories} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-sm font-semibold text-gray-900">Categories</h2>
              <button
                onClick={openCreateCategoryModal}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                + Add
              </button>
            </div>

            {categoriesError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {categoriesError}
              </div>
            )}

            {isLoadingCategories ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="flex h-[100px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
                <span className="text-xs text-gray-400">No categories yet.</span>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                <li>
                  <button
                    onClick={() => setActiveCategoryId("all")}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      activeCategoryId === "all" ? "bg-accent-soft text-accent" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All categories
                  </button>
                </li>
                {categories.map((category, i) => (
                  <li key={category.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                        activeCategoryId === category.id
                          ? "bg-accent-soft text-accent"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_DOTS[i % CATEGORY_DOTS.length]}`}
                      />
                      <span className="truncate">{category.name}</span>
                      {!category.isActive && (
                        <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                          Hidden
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openEditCategoryModal(category)}
                      className="shrink-0 rounded-md px-1.5 py-1 text-[11px] text-gray-400 opacity-0 hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100"
                      aria-label={`Edit ${category.name}`}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setPendingDeleteCategoryId(category.id)}
                      className="shrink-0 rounded-md px-1.5 py-1 text-[11px] text-gray-400 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      aria-label={`Delete ${category.name}`}
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ===== Create / Edit FAQ modal ===== */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="m-0 text-base font-semibold text-gray-900">{editingFaqId ? "Edit FAQ" : "New FAQ"}</h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {faqMutationError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {faqMutationError}
              </div>
            )}

            <form onSubmit={handleFaqSubmit} className="flex flex-col gap-4">
              <Field label="Question">
                <input
                  required
                  maxLength={255}
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <Field label="Answer">
                <textarea
                  required
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    value={faqForm.categoryId ?? ""}
                    onChange={(e) => setFaqForm({ ...faqForm, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Order">
                  <input
                    type="number"
                    value={faqForm.order}
                    onChange={(e) => setFaqForm({ ...faqForm, order: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={faqForm.isActive}
                  onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                Active
              </label>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={faqMutationStatus === "loading"}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 disabled:opacity-50"
                >
                  {faqMutationStatus === "loading" ? "Saving…" : editingFaqId ? "Save Changes" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Create / Edit category modal ===== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="m-0 text-base font-semibold text-gray-900">
                {editingCategoryId ? "Edit Category" : "New Category"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {categoryMutationError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {categoryMutationError}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
              <Field label="Name">
                <input
                  required
                  maxLength={100}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={2}
                  maxLength={255}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <Field label="Order">
                <input
                  type="number"
                  value={categoryForm.order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                Active (visible in public listings)
              </label>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryMutationStatus === "loading"}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm shadow-accent/30 disabled:opacity-50"
                >
                  {categoryMutationStatus === "loading"
                    ? "Saving…"
                    : editingCategoryId
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete FAQ confirm ===== */}
      {pendingDeleteFaqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="m-0 text-base font-semibold text-gray-900">Delete this FAQ?</h3>
            <p className="mt-2 text-sm text-gray-500">This action can&apos;t be undone.</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingDeleteFaqId(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteFaq}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-black hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete category confirm ===== */}
      {pendingDeleteCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="m-0 text-base font-semibold text-gray-900">Delete this category?</h3>
            <p className="mt-2 text-sm text-gray-500">
              FAQs in this category will become uncategorized rather than being deleted.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingDeleteCategoryId(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-black hover:bg-rose-700"
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
