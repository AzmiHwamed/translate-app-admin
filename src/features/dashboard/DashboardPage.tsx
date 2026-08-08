import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchFullDashboard } from "./dashboardSlice";
import { WorldMap, type CountryDatum } from "../../components/charts/WorldMap";

const COUNTRY_COLORS = [
  { dot: "bg-accent", bar: "bg-accent" },
  { dot: "bg-violet-500", bar: "bg-violet-500" },
  { dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { dot: "bg-amber-500", bar: "bg-amber-500" },
  { dot: "bg-rose-500", bar: "bg-rose-500" },
];

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { overview, usersPerCountry, revenue, status, error } = useAppSelector((state) => state.dashboard);

  const [selectedCountry, setSelectedCountry] = useState<CountryDatum | null>(null);

  useEffect(() => {
    dispatch(fetchFullDashboard());
  }, [dispatch]);

  const mapData: CountryDatum[] = useMemo(
    () =>
      usersPerCountry
        .filter((c) => c.alpha2Code)
        .map((c) => ({
          alpha2Code: c.alpha2Code as string,
          countryName: c.countryName ?? c.alpha2Code ?? "Unknown",
          userCount: Number(c.userCount),
        })),
    [usersPerCountry],
  );

  const topCountries = useMemo(() => [...mapData].sort((a, b) => b.userCount - a.userCount).slice(0, 5), [mapData]);
  const topCountryMax = topCountries[0]?.userCount ?? 1;

  const isLoading = status === "loading" && !overview;
  const hasError = status === "failed" && !overview;

  return (
    <>
      {hasError && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 shadow-sm">
          <span>{error}</span>
          <button
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            onClick={() => dispatch(fetchFullDashboard())}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Overview + map */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-900">Overview</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-400">Live totals across your active users</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
              Hover or click a country
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <div>
              <span className="text-xs font-medium text-gray-500">Revenue</span>
              <div className="mt-1 text-[28px] font-bold leading-none text-gray-900">
                {isLoading ? (
                  <span className="inline-block h-8 w-28 animate-pulse rounded bg-gray-100" />
                ) : (
                  (revenue?.totalRevenueRaw.toLocaleString() ?? "—")
                )}
              </div>
            </div>

            <div>
              {isLoading ? (
                <div className="flex h-[220px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
                  Loading map…
                </div>
              ) : mapData.length === 0 ? (
                <div className="flex h-[220px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center">
                  <span className="text-sm font-medium text-gray-500">No location data yet</span>
                  <span className="text-xs text-gray-400">Users need a country set for this to populate.</span>
                </div>
              ) : (
                <WorldMap data={mapData} onCountryClick={(country) => setSelectedCountry(country)} />
              )}
            </div>
          </div>

          {selectedCountry && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-accent-soft to-transparent px-4 py-3">
              <span className="text-sm font-medium text-gray-900">{selectedCountry.countryName}</span>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                {selectedCountry.userCount.toLocaleString()} users
              </span>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-4">
            <MiniStat icon="👥" label="Total Users" value={overview?.totalUsers} loading={isLoading} />
            <MiniStat
              icon="✨"
              label="Active Subscriptions"
              value={overview?.subscriptionBreakdown.active}
              loading={isLoading}
            />
            <MiniStat
              icon="⏱️"
              label="Trial Users"
              value={overview?.subscriptionBreakdown.trial}
              loading={isLoading}
            />
            <MiniStat icon="🌍" label="Countries" value={mapData.length || undefined} loading={isLoading} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-lg shadow-slate-900/5">
            <div>
              <p className="m-0 text-base font-semibold text-gray-900">Hey, need help? 👋</p>
              <p className="m-0 mt-0.5 text-sm text-gray-400">Just ask me anything!</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              🎙️
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <h2 className="m-0 mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">🏆</span> Top countries
            </h2>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : topCountries.length === 0 ? (
              <div className="text-sm text-gray-400">No country data yet.</div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {topCountries.map((c, i) => {
                  const palette = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
                  return (
                    <li key={c.alpha2Code}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className={`inline-flex h-2 w-2 rounded-full ${palette.dot}`} />
                          {c.countryName}
                        </span>
                        <span className="font-semibold text-gray-900">{c.userCount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${palette.bar}`}
                          style={{ width: `${(c.userCount / topCountryMax) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MiniStat({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: string | number | undefined;
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
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            (value ?? "—")
          )}
        </div>
      </div>
    </div>
  );
}
