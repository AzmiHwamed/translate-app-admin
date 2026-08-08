export interface Currency {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  isActive?: boolean;
}

export type UpdateCurrencyPayload = Partial<CreateCurrencyPayload>;

export interface ConvertResult {
  from: { id: string; code: string; name: string };
  to: { id: string; code: string; name: string };
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  date: string;
}
