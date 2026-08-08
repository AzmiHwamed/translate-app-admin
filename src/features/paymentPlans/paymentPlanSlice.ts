import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../common/ApiResponse";
import type { PaymentPlan, CreatePaymentPlanPayload, UpdatePaymentPlanPayload } from "./paymentPlanTypes";

interface PaymentPlanState {
  plans: PaymentPlan[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  mutationStatus: "idle" | "loading" | "failed";
  mutationError: string | null;
}

const initialState: PaymentPlanState = {
  plans: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

// Admin raw list (base-currency prices) — matches GET /payment-plans/raw
export const fetchPaymentPlans = createAsyncThunk<PaymentPlan[], void, { rejectValue: string }>(
  "paymentPlans/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<PaymentPlan[]>>("/payment-plans/raw");
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load payment plans");
    }
  },
);

export const createPaymentPlan = createAsyncThunk<PaymentPlan, CreatePaymentPlanPayload, { rejectValue: string }>(
  "paymentPlans/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<PaymentPlan>>("/payment-plans", payload);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to create plan");
    }
  },
);

interface UpdatePaymentPlanArgs {
  id: string;
  dto: UpdatePaymentPlanPayload;
}

export const updatePaymentPlan = createAsyncThunk<PaymentPlan, UpdatePaymentPlanArgs, { rejectValue: string }>(
  "paymentPlans/update",
  async ({ id, dto }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<ApiResponse<PaymentPlan>>(`/payment-plans/${id}`, dto);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to update plan");
    }
  },
);

export const deletePaymentPlan = createAsyncThunk<string, string, { rejectValue: string }>(
  "paymentPlans/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/payment-plans/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to delete plan");
    }
  },
);

const paymentPlanSlice = createSlice({
  name: "paymentPlans",
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentPlans.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPaymentPlans.fulfilled, (state, action: PayloadAction<PaymentPlan[]>) => {
        state.status = "succeeded";
        state.plans = action.payload;
      })
      .addCase(fetchPaymentPlans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load payment plans";
      })
      .addCase(createPaymentPlan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createPaymentPlan.fulfilled, (state, action: PayloadAction<PaymentPlan>) => {
        state.mutationStatus = "idle";
        state.plans.unshift(action.payload);
      })
      .addCase(createPaymentPlan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to create plan";
      })
      .addCase(updatePaymentPlan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updatePaymentPlan.fulfilled, (state, action: PayloadAction<PaymentPlan>) => {
        state.mutationStatus = "idle";
        const idx = state.plans.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.plans[idx] = action.payload;
      })
      .addCase(updatePaymentPlan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to update plan";
      })
      .addCase(deletePaymentPlan.fulfilled, (state, action: PayloadAction<string>) => {
        state.plans = state.plans.filter((p) => p.id !== action.payload);
      })
      .addCase(deletePaymentPlan.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Failed to delete plan";
      });
  },
});

export const { clearMutationError } = paymentPlanSlice.actions;
export default paymentPlanSlice.reducer;