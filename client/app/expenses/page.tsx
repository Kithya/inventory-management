"use client";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatTile,
  TablePagination,
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/app/(components)/ui";
import { useGetExpensesByCategoryQuery } from "@/state/api";
import {
  CalendarRange,
  CircleDollarSign,
  Layers3,
  RotateCcw,
} from "lucide-react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];
const pageSize = 10;

const Expenses = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const expensesQuery = useGetExpensesByCategoryQuery({
    category: selectedCategory,
    startDate,
    endDate,
    page,
    pageSize,
  });

  const visibleExpenses = expensesQuery.data?.data ?? [];
  const categories = expensesQuery.data?.meta?.categories ?? [];
  const aggregatedData = expensesQuery.data?.meta?.categoryTotals ?? [];
  const monthlyData = expensesQuery.data?.meta?.monthlyTotals ?? [];
  const totalExpenses = expensesQuery.data?.meta?.totalAmount ?? 0;
  const averageExpense = expensesQuery.data?.meta?.averageAmount ?? 0;
  const totalPages = expensesQuery.data?.pagination.totalPages ?? 0;
  const currentPage = expensesQuery.data?.pagination.page ?? page;
  const filteredCount = expensesQuery.data?.pagination.total ?? 0;

  const resetFilters = () => {
    setSelectedCategory("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const filtersAreActive =
    selectedCategory !== "All" || Boolean(startDate) || Boolean(endDate);

  if (expensesQuery.isLoading) {
    return <LoadingState label="Loading expenses" />;
  }

  if (expensesQuery.isError) {
    return <ErrorState onRetry={() => expensesQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        description="Analyze recorded expenses by category and date."
        actions={
          filtersAreActive ? (
            <button
              className="button-secondary w-full sm:w-auto"
              onClick={resetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </button>
          ) : null
        }
      />

      <div className="surface grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
            Category
          </span>
          <select
            className="field"
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setPage(1);
            }}
            value={selectedCategory}
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
            Start date
          </span>
          <input
            className="field"
            max={endDate || undefined}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            type="date"
            value={startDate}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
            End date
          </span>
          <input
            className="field"
            min={startDate || undefined}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            type="date"
            value={endDate}
          />
        </label>
        <div className="flex items-end">
          <div className="flex h-10 w-full items-center rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {formatNumber(filteredCount)} matching records
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Total expenses"
          value={formatCurrency(totalExpenses)}
          hint="For the selected filters"
          icon={CircleDollarSign}
          tone="amber"
        />
        <StatTile
          label="Average record"
          value={formatCurrency(averageExpense)}
          hint="Across selected records"
          icon={CalendarRange}
        />
        <StatTile
          label="Categories"
          value={formatNumber(aggregatedData.length)}
          hint="Represented in this view"
          icon={Layers3}
          tone="violet"
        />
      </div>

      {filteredCount === 0 ? (
        <div className="surface">
          <EmptyState
            title="No expenses match these filters"
            description="Change the category or date range to include more records."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Category breakdown"
              description="Share of expenses in the selected period"
            >
              <div className="grid min-h-72 grid-cols-1 items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_170px]">
                <div className="h-56 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {aggregatedData.map((entry, index) => (
                          <Cell
                            fill={colors[index % colors.length]}
                            key={entry.name}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#cbd5e1",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {aggregatedData.map((entry, index) => (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: colors[index % colors.length],
                            }}
                          />
                          <span className="truncate">{entry.name}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {totalExpenses > 0
                            ? `${((entry.amount / totalExpenses) * 100).toFixed(0)}%`
                            : "0%"}
                        </span>
                      </div>
                      <p className="ml-4.5 mt-0.5 text-xs text-slate-400">
                        {formatCurrency(entry.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Expense timeline"
              description="Monthly totals for the selected filters"
            >
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      stroke="#94a3b8"
                      strokeOpacity={0.18}
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="month"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(value) =>
                        new Date(`${value}-01T00:00:00`).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "2-digit" },
                        )
                      }
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(value) => formatCurrency(value, true)}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(value) =>
                        new Date(`${value}-01T00:00:00`).toLocaleDateString(
                          "en-US",
                          { month: "long", year: "numeric" },
                        )
                      }
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "#cbd5e1",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#2563eb"
                      maxBarSize={32}
                      name="Expenses"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Expense records"
            description="Filtered expense history"
          >
            <div className="overflow-x-auto">
              <table className="data-table min-w-[420px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => (
                    <tr key={expense.expenseByCategoryId}>
                      <td className="whitespace-nowrap">
                        {formatDate(expense.date)}
                      </td>
                      <td className="font-medium text-slate-900 dark:text-white">
                        {expense.category}
                      </td>
                      <td className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              onPageChange={setPage}
              page={currentPage}
              totalPages={totalPages}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default Expenses;
