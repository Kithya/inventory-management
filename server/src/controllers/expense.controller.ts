import type { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import {
  pageQuerySchema,
  pagination,
  serializeExpenseByCategory,
  toNumber,
} from "../lib/api.js";
import { asyncHandler } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const expenseQuerySchema = pageQuerySchema.extend({
  category: z.string().trim().default("All"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

function buildExpenseWhere(query: z.infer<typeof expenseQuerySchema>) {
  const and: Prisma.ExpenseByCategoryWhereInput[] = [];

  if (query.category && query.category !== "All") {
    and.push({ category: query.category });
  }

  if (query.startDate || query.endDate) {
    const date: Prisma.DateTimeFilter<"ExpenseByCategory"> = {};
    if (query.startDate) date.gte = new Date(`${query.startDate}T00:00:00.000Z`);
    if (query.endDate) date.lte = new Date(`${query.endDate}T23:59:59.999Z`);
    and.push({ date });
  }

  return and.length > 0 ? { AND: and } : {};
}

export const getExpensesByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const query = expenseQuerySchema.parse(req.query);
    const where = buildExpenseWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [allRecords, visibleRecords] = await Promise.all([
      prisma.expenseByCategory.findMany({
        where,
        orderBy: {
          date: "desc",
        },
      }),
      prisma.expenseByCategory.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip,
        take: query.pageSize,
      }),
    ]);

    const categoryTotals = new Map<string, number>();
    const monthlyTotals = new Map<string, number>();

    allRecords.forEach((record) => {
      const amount = toNumber(record.amount);
      categoryTotals.set(
        record.category,
        (categoryTotals.get(record.category) ?? 0) + amount,
      );
      const month = record.date.toISOString().slice(0, 7);
      monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + amount);
    });

    const totalAmount = allRecords.reduce(
      (total, record) => total + toNumber(record.amount),
      0,
    );

    res.json({
      data: visibleRecords.map(serializeExpenseByCategory),
      pagination: pagination(query.page, query.pageSize, allRecords.length),
      meta: {
        categories: Array.from(
          new Set(
            (
              await prisma.expenseByCategory.findMany({
                select: { category: true },
                distinct: ["category"],
                orderBy: { category: "asc" },
              })
            ).map((record) => record.category),
          ),
        ),
        totalAmount,
        averageAmount: allRecords.length > 0 ? totalAmount / allRecords.length : 0,
        categoryTotals: Array.from(categoryTotals, ([name, amount]) => ({
          name,
          amount,
        })).sort((a, b) => b.amount - a.amount),
        monthlyTotals: Array.from(monthlyTotals, ([month, amount]) => ({
          month,
          amount,
        })).sort((a, b) => a.month.localeCompare(b.month)),
      },
    });
  },
);
