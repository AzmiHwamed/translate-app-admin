import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient, tokenStorage } from "../../lib/apiClient";
import type { AdminUser, AuthResponse, LoginPayload } from "./authTypes";
import type { ApiResponse } from "../common/ApiResponse";


interface AuthState {
  user: AdminUser | null;
  idToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  idToken: tokenStorage.getIdToken(),
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", payload);
      return data.data;
    } catch (err: any) {
      console.log(err);
      const message = err?.response?.data?.body ?? err?.response?.data?.message ?? "Invalid credentials";
      return rejectWithValue(message);
    }
  },
);

// Rehydrate `user` on app load using the token already in storage.
// Wire this to a real GET /users/me (or similar) once you have the endpoint.
export const fetchCurrentUser = createAsyncThunk<AdminUser>("auth/fetchCurrentUser", async () => {
  const { data } = await apiClient.get<ApiResponse<AdminUser>>("/users/me");
  return data.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      tokenStorage.clear();
      state.user = null;
      state.idToken = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.idToken = action.payload.idToken;
        tokenStorage.setTokens(action.payload.idToken, action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<AdminUser>) => {
        state.user = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;