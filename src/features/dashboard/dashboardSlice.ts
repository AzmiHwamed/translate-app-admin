import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../common/ApiResponse";
import type {
  CountryStat,
  CurrencyStat,
  FullDashboard,
  OverviewStats,
  ProviderStat,
  RevenueSummary,
  SignupPoint,
} from "./dashboardTypes";

interface DashboardState {
  overview: OverviewStats | null;
  usersPerCountry: CountryStat[];
  usersPerCurrency: CurrencyStat[];
  usersPerProvider: ProviderStat[];
  signupsLast30Days: SignupPoint[];
  revenue: RevenueSummary | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DashboardState = {
  overview: null,
  usersPerCountry: [],
  usersPerCurrency: [],
  usersPerProvider: [],
  signupsLast30Days: [],
  revenue: null,
  status: "idle",
  error: null,
};

// One call gets everything — matches GET /admin/stats/dashboard
export const fetchFullDashboard = createAsyncThunk<FullDashboard, void, { rejectValue: string }>(
  "dashboard/fetchFullDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<FullDashboard>>("/admin/stats/dashboard");
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load dashboard");
    }
  },
);

// Individual endpoints, in case you want to refresh one section at a time
// instead of re-fetching the whole dashboard.

export const fetchOverview = createAsyncThunk<OverviewStats>("dashboard/fetchOverview", async () => {
  const { data } = await apiClient.get<ApiResponse<OverviewStats>>("/admin/stats/overview");
  return data.data;
});

export const fetchUsersPerCountry = createAsyncThunk<CountryStat[]>("dashboard/fetchUsersPerCountry", async () => {
  const { data } = await apiClient.get<ApiResponse<CountryStat[]>>("/admin/stats/users-per-country");
  return data.data;
});

export const fetchUsersPerCurrency = createAsyncThunk<CurrencyStat[]>("dashboard/fetchUsersPerCurrency", async () => {
  const { data } = await apiClient.get<ApiResponse<CurrencyStat[]>>("/admin/stats/users-per-currency");
  return data.data;
});

export const fetchUsersPerProvider = createAsyncThunk<ProviderStat[]>("dashboard/fetchUsersPerProvider", async () => {
  const { data } = await apiClient.get<ApiResponse<ProviderStat[]>>("/admin/stats/users-per-provider");
  return data.data;
});

export const fetchSignupsOverTime = createAsyncThunk<SignupPoint[], number | void>(
  "dashboard/fetchSignupsOverTime",
  async (days) => {
    const { data } = await apiClient.get<ApiResponse<SignupPoint[]>>("/admin/stats/signups-over-time", {
      params: days ? { days } : undefined,
    });
    return data.data;
  },
);

export const fetchRevenue = createAsyncThunk<RevenueSummary>("dashboard/fetchRevenue", async () => {
  const { data } = await apiClient.get<ApiResponse<RevenueSummary>>("/admin/stats/revenue");
  return data.data;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFullDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFullDashboard.fulfilled, (state, action: PayloadAction<FullDashboard>) => {
        state.status = "succeeded";
        state.overview = action.payload.overview;
        state.usersPerCountry = action.payload.usersPerCountry;
        state.usersPerCurrency = action.payload.usersPerCurrency;
        state.usersPerProvider = action.payload.usersPerProvider;
        state.signupsLast30Days = action.payload.signupsLast30Days;
        state.revenue = action.payload.revenue;
      })
      .addCase(fetchFullDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load dashboard";
      })
      // individual endpoint reducers, so calling them alone still updates state sensibly
      .addCase(fetchOverview.fulfilled, (state, action: PayloadAction<OverviewStats>) => {
        state.overview = action.payload;
      })
      .addCase(fetchUsersPerCountry.fulfilled, (state, action: PayloadAction<CountryStat[]>) => {
        state.usersPerCountry = action.payload;
      })
      .addCase(fetchUsersPerCurrency.fulfilled, (state, action: PayloadAction<CurrencyStat[]>) => {
        state.usersPerCurrency = action.payload;
      })
      .addCase(fetchUsersPerProvider.fulfilled, (state, action: PayloadAction<ProviderStat[]>) => {
        state.usersPerProvider = action.payload;
      })
      .addCase(fetchSignupsOverTime.fulfilled, (state, action: PayloadAction<SignupPoint[]>) => {
        state.signupsLast30Days = action.payload;
      })
      .addCase(fetchRevenue.fulfilled, (state, action: PayloadAction<RevenueSummary>) => {
        state.revenue = action.payload;
      });
  },
});

export default dashboardSlice.reducer;