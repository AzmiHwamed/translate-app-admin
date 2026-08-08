import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../common/ApiResponse";
import type { Currency, CreateCurrencyPayload, UpdateCurrencyPayload } from "./currencyTypes";

interface CurrencyState {
  currencies: Currency[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  mutationStatus: "idle" | "loading" | "failed";
  mutationError: string | null;
}

const initialState: CurrencyState = {
  currencies: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

interface UpdateCurrencyArgs {
  id: string;
  dto: UpdateCurrencyPayload;
}

export const fetchCurrencies = createAsyncThunk<Currency[], void, { rejectValue: string }>(
  "currencies/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<Currency[]>>("/currencies");
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load currencies");
    }
  },
);

export const createCurrency = createAsyncThunk<Currency, CreateCurrencyPayload, { rejectValue: string }>(
  "currencies/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<Currency>>("/currencies", payload);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to create currency");
    }
  },
);

export const updateCurrency = createAsyncThunk<Currency, UpdateCurrencyArgs, { rejectValue: string }>(
  "currencies/update",
  async ({ id, dto }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<ApiResponse<Currency>>(`/currencies/${id}`, dto);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to update currency");
    }
  },
);

export const deleteCurrency = createAsyncThunk<string, string, { rejectValue: string }>(
  "currencies/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/currencies/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to delete currency");
    }
  },
);

const currencySlice = createSlice({
  name: "currencies",
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action: PayloadAction<Currency[]>) => {
        state.status = "succeeded";
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load currencies";
      })
      .addCase(createCurrency.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createCurrency.fulfilled, (state, action: PayloadAction<Currency>) => {
        state.mutationStatus = "idle";
        state.currencies.push(action.payload);
        state.currencies.sort((a, b) => a.code.localeCompare(b.code));
      })
      .addCase(createCurrency.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to create currency";
      })
      .addCase(updateCurrency.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateCurrency.fulfilled, (state, action: PayloadAction<Currency>) => {
        state.mutationStatus = "idle";
        const idx = state.currencies.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.currencies[idx] = action.payload;
      })
      .addCase(updateCurrency.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to update currency";
      })
      .addCase(deleteCurrency.fulfilled, (state, action: PayloadAction<string>) => {
        state.currencies = state.currencies.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCurrency.rejected, (state, action) => {
        state.mutationError = action.payload ?? "Failed to delete currency";
      });
  },
});

export const { clearMutationError } = currencySlice.actions;
export default currencySlice.reducer;