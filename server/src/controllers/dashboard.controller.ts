import type { Request, Response } from "express";
import {
  serializeExpenseByCategory,
  serializeProduct,
  toIsoDate,
  toNumber,
} from "../lib/api.js";
import { asyncHandler } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export const getDashboardMetrics = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const [
      popularProducts,
      saleSummary,
      purchaseSummary,
      expenseSummary,
      expenseByCategorySummaryRaw,
      products,
      expenseRecords,
    ] = await Promise.all([
      prisma.products.findMany({
        take: 10,
        orderBy: {
          stockQuantity: "desc",
        },
      }),
      prisma.salesSummary.findMany({
        take: 5,
        orderBy: {
          date: "desc",
        },
      }),
      prisma.purchaseSummary.findMany({
        take: 5,
        orderBy: {
          date: "desc",
        },
      }),
      prisma.expenseSummary.findMany({
        take: 5,
        orderBy: {
          date: "desc",
        },
      }),
      prisma.expenseByCategory.findMany({
        take: 5,
        orderBy: {
          date: "desc",
        },
      }),
      prisma.products.findMany(),
      prisma.expenseByCategory.findMany(),
    ]);

    const totalUnits = products.reduce(
      (total, product) => total + product.stockQuantity,
      0,
    );
    const inventoryValue = products.reduce(
      (total, product) => total + toNumber(product.price) * product.stockQuantity,
      0,
    );
    const totalExpenses = expenseRecords.reduce(
      (total, expense) => total + toNumber(expense.amount),
      0,
    );

    res.status(200).json({
      popularProducts: popularProducts.map(serializeProduct),
      saleSummary: saleSummary.map((item) => ({
        ...item,
        totalValue: toNumber(item.totalValue),
        date: toIsoDate(item.date),
      })),
      purchaseSummary: purchaseSummary.map((item) => ({
        ...item,
        totalPurchased: toNumber(item.totalPurchased),
        date: toIsoDate(item.date),
      })),
      expenseSummary: expenseSummary.map((item) => ({
        ...item,
        totalValue: toNumber(item.totalValue),
        date: toIsoDate(item.date),
      })),
      expenseByCategorySummary: expenseByCategorySummaryRaw.map(
        serializeExpenseByCategory,
      ),
      productCount: products.length,
      totalUnits,
      inventoryValue,
      totalExpenses,
      expenseRecordCount: expenseRecords.length,
    });
  },
);
