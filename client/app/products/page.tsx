"use client";

import Rating from "@/app/(components)/Rating";
import { useInventoryAuth } from "@/app/auth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
  TablePagination,
  formatCurrency,
  formatNumber,
  initials,
} from "@/app/(components)/ui";
import { useCreateProductMutation, useGetProductsQuery } from "@/state/api";
import { PackagePlus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import CreateProductModal from "./CreateProductModal";

type SortOption = "name" | "price-asc" | "price-desc" | "stock" | "rating";
const pageSize = 12;

function ProductsContent({ initialQuery }: { initialQuery: string }) {
  const { isAdmin } = useInventoryAuth();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedQuery) params.set("q", debouncedQuery);
    else params.delete("q");

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const syncFromHistory = () => {
      const nextQuery =
        new URLSearchParams(window.location.search).get("q") ?? "";
      setQuery(nextQuery);
      setDebouncedQuery(nextQuery);
    };

    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);

  const productsQuery = useGetProductsQuery({
    search: debouncedQuery,
    sortBy,
    page,
    pageSize,
  });
  const [createProduct, createState] = useCreateProductMutation();
  const products = productsQuery.data?.data ?? [];
  const pagination = productsQuery.data?.pagination;

  const handleCreate = async (data: {
    name: string;
    price: number;
    stockQuantity: number;
    rating?: number;
  }) => {
    const product = await createProduct(data).unwrap();
    setSuccessMessage(`${product.name} was created.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Browse the catalog and add products to inventory."
        actions={
          <button
            className="button-primary w-full sm:w-auto"
            disabled={!isAdmin}
            onClick={() => setIsModalOpen(true)}
            title={isAdmin ? "Create product" : "Administrator access is required"}
          >
            <PackagePlus className="h-4 w-4" />
            Create product
          </button>
        }
      />

      <div className="surface flex flex-col gap-3 p-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field field-icon-left"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              setSuccessMessage("");
            }}
            placeholder="Search by product name..."
            type="search"
            value={query}
          />
        </label>
        <label className="sm:w-52">
          <span className="sr-only">Sort products</span>
          <select
            className="field min-w-48"
            onChange={(event) => {
              setSortBy(event.target.value as SortOption);
              setPage(1);
              setSuccessMessage("");
            }}
            value={sortBy}
          >
            <option value="name">Name A-Z</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="stock">Highest stock</option>
            <option value="rating">Highest rating</option>
          </select>
        </label>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {productsQuery.isLoading ? (
        <LoadingState label="Loading products" />
      ) : productsQuery.isError ? (
        <ErrorState onRetry={() => productsQuery.refetch()} />
      ) : products.length === 0 ? (
        <div className="surface">
          <EmptyState
            title={debouncedQuery ? "No matching products" : "No products yet"}
            description={
              debouncedQuery
                ? "Try a different search term or clear the current search."
                : "Create the first product to start building your catalog."
            }
          />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {formatNumber(pagination?.total ?? products.length)}{" "}
            {(pagination?.total ?? products.length) === 1 ? "product" : "products"}
          </p>
          <div className="grid gap-3 min-[640px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <article
                className="surface group flex min-w-0 items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
                key={product.productId}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {initials(product.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    className="truncate font-semibold text-slate-900 dark:text-white"
                    title={product.name}
                  >
                    {product.name}
                  </h2>
                  <p className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={product.stockQuantity === 0 ? "danger" : "neutral"}
                    >
                      {formatNumber(product.stockQuantity)} units
                    </StatusBadge>
                    <Rating rating={product.rating ?? 0} />
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pagination ? (
            <div className="table-shell mt-4">
              <TablePagination
                onPageChange={setPage}
                page={pagination.page}
                totalPages={pagination.totalPages}
              />
            </div>
          ) : null}
        </>
      )}

      <CreateProductModal
        isCreating={createState.isLoading}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  return <ProductsContent initialQuery={initialQuery} />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading products" />}>
      <ProductsPageContent />
    </Suspense>
  );
}
