import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "./authToken";

export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummaryId: string;
  totalValue: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategoryId: string;
  expenseSummaryId: string;
  category: string;
  amount: number;
  date: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED";
}

export interface Invite {
  inviteId: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdBy: { name: string; email: string } | null;
  acceptedBy: { name: string; email: string } | null;
}

export interface CreateInviteInput {
  email: string;
  name?: string;
  role: "ADMIN" | "USER";
}

export interface CreateInviteResponse {
  invite: Invite;
  inviteLink: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  saleSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
  productCount: number;
  totalUnits: number;
  inventoryValue: number;
  totalExpenses: number;
  expenseRecordCount: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T, TMeta = unknown> {
  data: T[];
  pagination: PaginationMeta;
  meta?: TMeta;
}

export type ProductSort =
  | "name"
  | "price-asc"
  | "price-desc"
  | "stock"
  | "stock-asc"
  | "stock-desc"
  | "rating"
  | "value";

export interface ProductsQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: ProductSort;
  stockFilter?: "all" | "low" | "healthy" | "empty";
  lowStockThreshold?: number;
}

export interface ProductListMeta {
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  allProductCount: number;
}

export interface UsersQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ExpensesQuery {
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ExpensesMeta {
  categories: string[];
  totalAmount: number;
  averageAmount: number;
  categoryTotals: Array<{ name: string; amount: number }>;
  monthlyTotals: Array<{ month: string; amount: number }>;
}

function cleanParams(params: object) {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    credentials: "include",
    prepareHeaders: async (headers) => {
      const token = await getAuthToken();
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["DashboardMetrics", "Products", "Users", "Expenses", "Invites"],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    getProducts: build.query<
      PaginatedResponse<Product, ProductListMeta>,
      ProductsQuery | void
    >({
      query: (args) => ({
        url: "/products",
        params: cleanParams(args ?? {}),
      }),
      keepUnusedDataFor: 300,
      providesTags: ["Products"],
    }),
    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products", "DashboardMetrics"],
    }),
    getUser: build.query<PaginatedResponse<User>, UsersQuery | void>({
      query: (args) => ({
        url: "/users",
        params: cleanParams(args ?? {}),
      }),
      providesTags: ["Users"],
    }),
    getInvites: build.query<{ data: Invite[] }, void>({
      query: () => "/users/invites",
      providesTags: ["Invites"],
    }),
    createInvite: build.mutation<CreateInviteResponse, CreateInviteInput>({
      query: (body) => ({
        url: "/users/invites",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invites"],
    }),
    revokeInvite: build.mutation<{ ok: boolean }, string>({
      query: (inviteId) => ({
        url: `/users/invites/${inviteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invites"],
    }),
    getExpensesByCategory: build.query<
      PaginatedResponse<ExpenseByCategorySummary, ExpensesMeta>,
      ExpensesQuery | void
    >({
      query: (args) => ({
        url: "/expenses",
        params: cleanParams(args ?? {}),
      }),
      providesTags: ["Expenses"],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useGetUserQuery,
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useGetExpensesByCategoryQuery,
} = api;
