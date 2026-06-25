import { z } from "zod";

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export function pagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
}

export function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeProduct(product: {
  productId: string;
  name: string;
  price: unknown;
  rating: number | null;
  stockQuantity: number;
}) {
  return {
    productId: product.productId,
    name: product.name,
    price: toNumber(product.price),
    rating: product.rating ?? undefined,
    stockQuantity: product.stockQuantity,
  };
}

export function serializeExpenseByCategory(expense: {
  expenseByCategoryId: string;
  expenseSummaryId: string;
  category: string;
  amount: unknown;
  date: Date | string;
}) {
  return {
    expenseByCategoryId: expense.expenseByCategoryId,
    expenseSummaryId: expense.expenseSummaryId,
    category: expense.category,
    amount: toNumber(expense.amount),
    date: toIsoDate(expense.date),
  };
}

export function serializeUser(user: {
  userId: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
}) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role ?? "USER",
    status: user.status ?? "ACTIVE",
  };
}
