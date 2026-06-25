"use client";
import {
  ErrorState,
  formatCurrency,
  formatDate,
  formatNumber,
  LoadingState,
  PageHeader,
  SectionCard,
  StatTile,
  initials,
} from "@/app/(components)/ui";
import {
  useGetDashboardMetricsQuery,
} from "@/state/api";
import {
  Boxes,
  CircleDollarSign,
  Package,
  Warehouse,
} from "lucide-react";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
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

const chartColors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

const Dashboard = () => {
  const dashboardQuery = useGetDashboardMetricsQuery();
  const dashboard = dashboardQuery.data;

  const expenseCategories = useMemo(() => {
    const totals = new Map<string, number>();
    (dashboard?.expenseByCategorySummary ?? []).forEach((expense) => {
      totals.set(
        expense.category,
        (totals.get(expense.category) ?? 0) + expense.amount,
      );
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [dashboard?.expenseByCategorySummary]);

  const topStocked = dashboard?.popularProducts.slice(0, 6) ?? [];
  const salesData = [...(dashboard?.saleSummary ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const purchaseData = [...(dashboard?.purchaseSummary ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (
    dashboardQuery.isLoading
  ) {
    return <LoadingState label="Loading operations dashboard" />;
  }

  if (
    dashboardQuery.isError ||
    !dashboard
  ) {
    return (
      <ErrorState
        title="Dashboard data is unavailable"
        onRetry={() => {
          dashboardQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="A live overview of inventory, sales, purchases, and expenses."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Products"
          value={formatNumber(dashboard.productCount)}
          hint="Active catalog records"
          icon={Package}
        />
        <StatTile
          label="Units on hand"
          value={formatNumber(dashboard.totalUnits, true)}
          hint="Across all products"
          icon={Boxes}
          tone="emerald"
        />
        <StatTile
          label="Inventory value"
          value={formatCurrency(dashboard.inventoryValue, true)}
          hint="Price × units on hand"
          icon={Warehouse}
          tone="violet"
        />
        <StatTile
          label="Recorded expenses"
          value={formatCurrency(dashboard.totalExpenses)}
          hint={`${formatNumber(dashboard.expenseRecordCount)} expense summaries`}
          icon={CircleDollarSign}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          title="Sales trend"
          description="Latest recorded sales summary"
          className="xl:col-span-2"
        >
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid
                  stroke="#94a3b8"
                  strokeOpacity={0.18}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value, true)}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(value) => formatDate(String(value))}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#cbd5e1",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="totalValue"
                  name="Sales"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Expenses by category"
          description="All recorded expense summaries"
        >
          <div className="grid min-h-72 grid-cols-1 items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <div className="h-48 min-w-0 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {expenseCategories.map((category, index) => (
                      <Cell
                        key={category.name}
                        fill={chartColors[index % chartColors.length]}
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
            <div className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
              {expenseCategories.map((category, index) => (
                <div key={category.name} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                      {category.name}
                    </span>
                  </div>
                  <p className="ml-4 mt-0.5 text-xs text-slate-400">
                    {formatCurrency(category.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Purchase trend"
          description="Latest recorded purchase summary"
        >
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={purchaseData}>
                <defs>
                  <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#94a3b8"
                  strokeOpacity={0.18}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value, true)}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(value) => formatDate(String(value))}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#cbd5e1",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalPurchased"
                  name="Purchases"
                  stroke="#7c3aed"
                  fill="url(#purchaseFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Top stocked products"
          description="Products ranked by current units on hand"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topStocked.map((product, index) => (
              <div
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
                key={product.productId}
              >
                <span className="w-5 text-xs font-semibold text-slate-400">
                  {index + 1}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {initials(product.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(product.price)} per unit
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {formatNumber(product.stockQuantity, true)}
                  <span className="hidden sm:inline"> units</span>
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Dashboard;
