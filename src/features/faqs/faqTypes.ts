export interface FaqCategory {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: FaqCategory | null;
  categoryId?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqCategoryPayload {
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export type UpdateFaqCategoryPayload = Partial<CreateFaqCategoryPayload>;

export interface CreateFaqPayload {
  question: string;
  answer: string;
  categoryId?: string;
  order?: number;
  isActive?: boolean;
}

export type UpdateFaqPayload = Partial<CreateFaqPayload>;
