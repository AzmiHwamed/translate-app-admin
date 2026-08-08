export interface OverviewStats {
  totalUsers: number;
  adminCount: number;
  subscriptionBreakdown: {
    active: number;
    trial: number;
    expired: number;
    cancelled: number;
  };
}

export interface CountryStat {
  countryId: string | null;
  countryName: string | null;
  alpha2Code: string | null;
  userCount: string; // raw COUNT(...) comes back as a string from postgres
}

export interface CurrencyStat {
  currencyId: string | null;
  currencyCode: string | null;
  currencyName: string | null;
  userCount: string;
}

export interface ProviderStat {
  provider: string;
  userCount: string;
}

export interface SignupPoint {
  date: string; // YYYY-MM-DD
  signups: string;
}

export interface RevenueSummary {
  totalRevenueRaw: number;
  succeededPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

export interface FullDashboard {
  overview: OverviewStats;
  usersPerCountry: CountryStat[];
  usersPerCurrency: CurrencyStat[];
  usersPerProvider: ProviderStat[];
  signupsLast30Days: SignupPoint[];
  revenue: RevenueSummary;
}
