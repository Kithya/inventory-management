"use client";

import { useAppSelector } from "@/app/redux";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatTile,
  StatusBadge,
  TablePagination,
  formatCurrency,
  formatNumber,
} from "@/app/(components)/ui";
import { useGetProductsQuery } from "@/state/api";
import { AlertTriangle, Boxes, Search, Warehouse } from "lucide-react";
import React, { useState } from "react";

const pageSize = 10;

type StockFilter = "all" | "low" | "healthy" | "empty";
type InventorySort = "name" | "stock-asc" | "stock-desc" | "value";

const Inventory = () => {
  const threshold = useAppSelector(
    (state) => state.global.lowStockThreshold ?? 100,
  );
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<InventorySort>("name");
  const [page, setPage] = useState(1);
  const productsQuery = useGetProductsQuery({
    search,
    stockFilter,
    sortBy,
    page,
    pageSize,
    lowStockThreshold: threshold,
  });

  const visibleProducts = productsQuery.data?.data ?? [];
  const totalPages = productsQuery.data?.pagination.totalPages ?? 0;
  const currentPage = productsQuery.data?.pagination.page ?? page;
  const totalUnits = productsQuery.data?.meta?.totalUnits ?? 0;
  const inventoryValue = productsQuery.data?.meta?.inventoryValue ?? 0;
  const lowStockCount = productsQuery.data?.meta?.lowStockCount ?? 0;
  const filteredCount = productsQuery.data?.pagination.total ?? 0;

  const updateFilter = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  if (productsQuery.isLoading) {
    return <LoadingState label="Loading inventory" />;
  }

  if (productsQuery.isError) {
    return <ErrorState onRetry={() => productsQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and the current value of inventory."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Units on hand"
          value={formatNumber(totalUnits, true)}
          hint="Across the current catalog"
          icon={Boxes}
        />
        <StatTile
          label="Inventory value"
          value={formatCurrency(inventoryValue, true)}
          hint="Price × units on hand"
          icon={Warehouse}
          tone="emerald"
        />
        <StatTile
          label="Low stock"
          value={formatNumber(lowStockCount)}
          hint={`At or below ${formatNumber(threshold)} units`}
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <div className="surface grid gap-3 p-3 md:grid-cols-[minmax(240px,1fr)_180px_190px]">
        <label className="relative">
          <span className="sr-only">Search inventory</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field field-icon-left"
            onChange={(event) => updateFilter(setSearch, event.target.value)}
            placeholder="Search inventory..."
            type="search"
            value={search}
          />
        </label>
        <select
          className="field"
          onChange={(event) =>
            updateFilter(setStockFilter, event.target.value as StockFilter)
          }
          value={stockFilter}
        >
          <option value="all">All stock levels</option>
          <option value="healthy">Healthy stock</option>
          <option value="low">Low stock</option>
          <option value="empty">Out of stock</option>
        </select>
        <select
          className="field"
          onChange={(event) =>
            updateFilter(setSortBy, event.target.value as InventorySort)
          }
          value={sortBy}
        >
          <option value="name">Name A-Z</option>
          <option value="stock-asc">Stock: low to high</option>
          <option value="stock-desc">Stock: high to low</option>
          <option value="value">Highest stock value</option>
        </select>
        <p className="text-xs font-medium text-slate-500 md:col-span-3 dark:text-slate-400">
          {formatNumber(filteredCount)}{" "}
          {filteredCount === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="table-shell">
        {visibleProducts.length === 0 ? (
          <EmptyState
            title="No inventory records match"
            description="Adjust the search or stock-level filter to see more products."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[480px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="hidden text-right sm:table-cell">
                    Unit price
                  </th>
                  <th className="text-right">Units on hand</th>
                  <th className="hidden text-right md:table-cell">
                    Stock value
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const isEmpty = product.stockQuantity === 0;
                  const isLow =
                    product.stockQuantity > 0 &&
                    product.stockQuantity <= threshold;
                  return (
                    <tr key={product.productId}>
                      <td>
                        <p className="max-w-xs truncate font-medium text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                      </td>
                      <td className="hidden text-right tabular-nums sm:table-cell">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        {formatNumber(product.stockQuantity)}
                      </td>
                      <td className="hidden text-right tabular-nums md:table-cell">
                        {formatCurrency(
                          product.price * product.stockQuantity,
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          tone={isEmpty ? "danger" : isLow ? "warning" : "success"}
                        >
                          {isEmpty
                            ? "Out of stock"
                            : isLow
                              ? "Low stock"
                              : "Healthy"}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          onPageChange={setPage}
          page={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};

export default Inventory;
