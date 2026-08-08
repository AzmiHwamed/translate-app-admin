export interface Currency {
  id: string;
  code: string;
  name: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  basePrice: number;
  baseCurrencyId: string;
  baseCurrency?: Currency;
  isActive: boolean;
}

export interface CreatePaymentPlanPayload {
  name: string;
  description: string;
  durationMonths: number;
  basePrice: number;
  baseCurrencyId: string;
  isActive?: boolean;
}

export type UpdatePaymentPlanPayload = Partial<CreatePaymentPlanPayload>;
