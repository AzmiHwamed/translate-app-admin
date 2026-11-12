import { useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../common/ApiResponse";

type AiServiceKey = "receiptScan" | "interpreterTurn" | "textTranslation" | "tripPlan";
type ServicePrice = { id: string; service: AiServiceKey; tokenCost: number };

const LABELS: Record<ServicePrice["service"], { title: string; description: string; icon: string }> = {
  receiptScan: { title: "Receipt scanning", description: "Charged when a receipt is extracted with AI.", icon: "📷" },
  interpreterTurn: { title: "Live interpreter", description: "Charged for each completed spoken translation turn.", icon: "🎙️" },
  textTranslation: { title: "Text translation", description: "Charged for each completed text translation.", icon: "💬" },
  tripPlan: { title: "AI trip plan", description: "Charged when an AI itinerary and budget guidance are generated or refreshed.", icon: "🗺️" },
};

export function AiPricingPage() {
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ApiResponse<ServicePrice[]> | ServicePrice[]>("/admin/ai-service-prices");
      const items = Array.isArray(data) ? data : data.data;
      setPrices(items);
      setDrafts(Object.fromEntries(items.map((item) => [item.service, item.tokenCost])));
    } catch (reason: any) {
      setError(reason?.response?.data?.body ?? "Could not load AI service prices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(service: ServicePrice["service"]) {
    const tokenCost = Number(drafts[service]);
    if (!Number.isInteger(tokenCost) || tokenCost < 0) {
      setError("Token costs must be whole numbers of zero or more.");
      return;
    }
    setSaving(service);
    setError(null);
    try {
      const { data } = await apiClient.put<ApiResponse<ServicePrice> | ServicePrice>("/admin/ai-service-prices", { service, tokenCost });
      const saved = Array.isArray(data) ? undefined : ("data" in data ? data.data : data);
      if (saved) setPrices((current) => current.map((item) => item.service === service ? saved : item));
    } catch (reason: any) {
      setError(reason?.response?.data?.body ?? "Could not save the token cost.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <p className="m-0 text-sm font-semibold text-gray-900">AI service pricing</p>
        <p className="m-0 mt-1 text-sm text-gray-500">Set token costs shown to users before they run an AI feature. Tokens are refunded automatically if a provider request fails.</p>
      </section>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="h-56 animate-pulse rounded-2xl bg-white" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {prices.map((price) => {
            const item = LABELS[price.service];
            return <section key={price.service} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-slate-900/5">
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              <h2 className="mb-1 mt-3 text-base font-semibold text-gray-900">{item.title}</h2>
              <p className="min-h-10 text-xs leading-5 text-gray-500">{item.description}</p>
              <label className="mt-5 block text-xs font-medium text-gray-600">Tokens per completed use
                <input type="number" min="0" step="1" value={drafts[price.service] ?? price.tokenCost} onChange={(event) => setDrafts((old) => ({ ...old, [price.service]: Number(event.target.value) }))} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent" />
              </label>
              <button onClick={() => void save(price.service)} disabled={saving === price.service} className="mt-3 w-full rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">{saving === price.service ? "Saving…" : "Save cost"}</button>
            </section>;
          })}
        </div>
      )}
    </div>
  );
}
