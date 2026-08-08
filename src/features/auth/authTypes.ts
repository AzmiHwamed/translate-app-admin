export interface AdminUser {
  id: string;
  role: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: string;
  isActive: boolean;
  currentCountryId: string | null;
  currencyId: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  paymentCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  currentCountry: unknown | null;
  currency: unknown | null;
}

export interface AuthResponse {
  user: AdminUser;
  idToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
