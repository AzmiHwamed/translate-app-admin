import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../common/ApiResponse";
import type {
  Faq,
  FaqCategory,
  CreateFaqPayload,
  UpdateFaqPayload,
  CreateFaqCategoryPayload,
  UpdateFaqCategoryPayload,
} from "./faqTypes";

interface FaqState {
  categories: FaqCategory[];
  categoriesStatus: "idle" | "loading" | "succeeded" | "failed";
  categoriesError: string | null;
  categoryMutationStatus: "idle" | "loading" | "failed";
  categoryMutationError: string | null;

  faqs: Faq[];
  faqsStatus: "idle" | "loading" | "succeeded" | "failed";
  faqsError: string | null;
  faqMutationStatus: "idle" | "loading" | "failed";
  faqMutationError: string | null;
}

const initialState: FaqState = {
  categories: [],
  categoriesStatus: "idle",
  categoriesError: null,
  categoryMutationStatus: "idle",
  categoryMutationError: null,

  faqs: [],
  faqsStatus: "idle",
  faqsError: null,
  faqMutationStatus: "idle",
  faqMutationError: null,
};

// ── Categories ──────────────────────────────

export const fetchFaqCategories = createAsyncThunk<FaqCategory[], void, { rejectValue: string }>(
  "faqs/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<FaqCategory[]>>("/faqs/categories");
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load categories");
    }
  },
);

export const createFaqCategory = createAsyncThunk<FaqCategory, CreateFaqCategoryPayload, { rejectValue: string }>(
  "faqs/createCategory",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<FaqCategory>>("/faqs/categories", payload);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to create category");
    }
  },
);

interface UpdateFaqCategoryArgs {
  categoryId: string;
  dto: UpdateFaqCategoryPayload;
}

export const updateFaqCategory = createAsyncThunk<FaqCategory, UpdateFaqCategoryArgs, { rejectValue: string }>(
  "faqs/updateCategory",
  async ({ categoryId, dto }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<ApiResponse<FaqCategory>>(`/faqs/categories/${categoryId}`, dto);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to update category");
    }
  },
);

export const deleteFaqCategory = createAsyncThunk<string, string, { rejectValue: string }>(
  "faqs/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/faqs/categories/${categoryId}`);
      return categoryId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to delete category");
    }
  },
);

// ── FAQs ────────────────────────────────────

export const fetchFaqs = createAsyncThunk<Faq[], string | undefined, { rejectValue: string }>(
  "faqs/fetchAll",
  async (categoryId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<Faq[]>>("/faqs", {
        params: categoryId ? { categoryId } : undefined,
      });
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load FAQs");
    }
  },
);

export const createFaq = createAsyncThunk<Faq, CreateFaqPayload, { rejectValue: string }>(
  "faqs/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<Faq>>("/faqs", payload);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to create FAQ");
    }
  },
);

interface UpdateFaqArgs {
  id: string;
  dto: UpdateFaqPayload;
}

export const updateFaq = createAsyncThunk<Faq, UpdateFaqArgs, { rejectValue: string }>(
  "faqs/update",
  async ({ id, dto }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<ApiResponse<Faq>>(`/faqs/${id}`, dto);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to update FAQ");
    }
  },
);

export const deleteFaq = createAsyncThunk<string, string, { rejectValue: string }>(
  "faqs/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/faqs/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to delete FAQ");
    }
  },
);

const faqSlice = createSlice({
  name: "faqs",
  initialState,
  reducers: {
    clearCategoryMutationError(state) {
      state.categoryMutationError = null;
    },
    clearFaqMutationError(state) {
      state.faqMutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchFaqCategories.pending, (state) => {
        state.categoriesStatus = "loading";
        state.categoriesError = null;
      })
      .addCase(fetchFaqCategories.fulfilled, (state, action: PayloadAction<FaqCategory[]>) => {
        state.categoriesStatus = "succeeded";
        state.categories = action.payload;
      })
      .addCase(fetchFaqCategories.rejected, (state, action) => {
        state.categoriesStatus = "failed";
        state.categoriesError = action.payload ?? "Failed to load categories";
      })
      .addCase(createFaqCategory.pending, (state) => {
        state.categoryMutationStatus = "loading";
        state.categoryMutationError = null;
      })
      .addCase(createFaqCategory.fulfilled, (state, action: PayloadAction<FaqCategory>) => {
        state.categoryMutationStatus = "idle";
        state.categories.push(action.payload);
      })
      .addCase(createFaqCategory.rejected, (state, action) => {
        state.categoryMutationStatus = "failed";
        state.categoryMutationError = action.payload ?? "Failed to create category";
      })
      .addCase(updateFaqCategory.pending, (state) => {
        state.categoryMutationStatus = "loading";
        state.categoryMutationError = null;
      })
      .addCase(updateFaqCategory.fulfilled, (state, action: PayloadAction<FaqCategory>) => {
        state.categoryMutationStatus = "idle";
        const idx = state.categories.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.categories[idx] = action.payload;
      })
      .addCase(updateFaqCategory.rejected, (state, action) => {
        state.categoryMutationStatus = "failed";
        state.categoryMutationError = action.payload ?? "Failed to update category";
      })
      .addCase(deleteFaqCategory.fulfilled, (state, action: PayloadAction<string>) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
        // FAQs in this category become uncategorized on the backend; mirror that locally.
        state.faqs = state.faqs.map((f) =>
          f.categoryId === action.payload ? { ...f, categoryId: null, category: null } : f,
        );
      })
      .addCase(deleteFaqCategory.rejected, (state, action) => {
        state.categoryMutationError = action.payload ?? "Failed to delete category";
      })
      // FAQs
      .addCase(fetchFaqs.pending, (state) => {
        state.faqsStatus = "loading";
        state.faqsError = null;
      })
      .addCase(fetchFaqs.fulfilled, (state, action: PayloadAction<Faq[]>) => {
        state.faqsStatus = "succeeded";
        state.faqs = action.payload;
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.faqsStatus = "failed";
        state.faqsError = action.payload ?? "Failed to load FAQs";
      })
      .addCase(createFaq.pending, (state) => {
        state.faqMutationStatus = "loading";
        state.faqMutationError = null;
      })
      .addCase(createFaq.fulfilled, (state, action: PayloadAction<Faq>) => {
        state.faqMutationStatus = "idle";
        state.faqs.push(action.payload);
      })
      .addCase(createFaq.rejected, (state, action) => {
        state.faqMutationStatus = "failed";
        state.faqMutationError = action.payload ?? "Failed to create FAQ";
      })
      .addCase(updateFaq.pending, (state) => {
        state.faqMutationStatus = "loading";
        state.faqMutationError = null;
      })
      .addCase(updateFaq.fulfilled, (state, action: PayloadAction<Faq>) => {
        state.faqMutationStatus = "idle";
        const idx = state.faqs.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.faqs[idx] = action.payload;
      })
      .addCase(updateFaq.rejected, (state, action) => {
        state.faqMutationStatus = "failed";
        state.faqMutationError = action.payload ?? "Failed to update FAQ";
      })
      .addCase(deleteFaq.fulfilled, (state, action: PayloadAction<string>) => {
        state.faqs = state.faqs.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFaq.rejected, (state, action) => {
        state.faqMutationError = action.payload ?? "Failed to delete FAQ";
      });
  },
});

export const { clearCategoryMutationError, clearFaqMutationError } = faqSlice.actions;
export default faqSlice.reducer;