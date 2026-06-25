import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { pageQuerySchema, pagination, serializeProduct, toNumber } from "../lib/api.js";
import { asyncHandler } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const productQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().default(""),
  sortBy: z
    .enum(["name", "price-asc", "price-desc", "stock", "stock-asc", "stock-desc", "rating", "value"])
    .default("name"),
  stockFilter: z.enum(["all", "low", "healthy", "empty"]).default("all"),
  lowStockThreshold: z.coerce.number().int().min(0).default(100),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0),
});

function buildProductWhere(query: z.infer<typeof productQuerySchema>) {
  const and: Prisma.ProductsWhereInput[] = [];

  if (query.search) {
    and.push({
      name: {
        contains: query.search,
        mode: Prisma.QueryMode.insensitive,
      },
    });
  }

  if (query.stockFilter === "empty") {
    and.push({ stockQuantity: 0 });
  } else if (query.stockFilter === "low") {
    and.push({
      stockQuantity: {
        gt: 0,
        lte: query.lowStockThreshold,
      },
    });
  } else if (query.stockFilter === "healthy") {
    and.push({
      stockQuantity: {
        gt: query.lowStockThreshold,
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function productOrderBy(sortBy: z.infer<typeof productQuerySchema>["sortBy"]) {
  if (sortBy === "price-asc") return { price: "asc" as const };
  if (sortBy === "price-desc") return { price: "desc" as const };
  if (sortBy === "stock" || sortBy === "stock-desc") {
    return { stockQuantity: "desc" as const };
  }
  if (sortBy === "stock-asc") return { stockQuantity: "asc" as const };
  if (sortBy === "rating") return { rating: "desc" as const };
  return { name: "asc" as const };
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const where = buildProductWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const allProducts = await prisma.products.findMany();
  const totalUnits = allProducts.reduce(
    (total, product) => total + product.stockQuantity,
    0,
  );
  const inventoryValue = allProducts.reduce(
    (total, product) => total + toNumber(product.price) * product.stockQuantity,
    0,
  );
  const lowStockCount = allProducts.filter(
    (product) =>
      product.stockQuantity > 0 &&
      product.stockQuantity <= query.lowStockThreshold,
  ).length;

  if (query.sortBy === "value") {
    const filtered = await prisma.products.findMany({ where });
    const sorted = filtered.sort(
      (a, b) =>
        toNumber(b.price) * b.stockQuantity -
        toNumber(a.price) * a.stockQuantity,
    );

    res.json({
      data: sorted.slice(skip, skip + query.pageSize).map(serializeProduct),
      pagination: pagination(query.page, query.pageSize, sorted.length),
      meta: {
        totalUnits,
        inventoryValue,
        lowStockCount,
        allProductCount: allProducts.length,
      },
    });
    return;
  }

  const [total, products] = await Promise.all([
    prisma.products.count({ where }),
    prisma.products.findMany({
      where,
      orderBy: productOrderBy(query.sortBy),
      skip,
      take: query.pageSize,
    }),
  ]);

  res.json({
    data: products.map(serializeProduct),
    pagination: pagination(query.page, query.pageSize, total),
    meta: {
      totalUnits,
      inventoryValue,
      lowStockCount,
      allProductCount: allProducts.length,
    },
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.products.create({
    data: {
      productId: randomUUID(),
      name: data.name,
      price: data.price,
      rating: data.rating ?? null,
      stockQuantity: data.stockQuantity,
    },
  });

  res.status(201).json(serializeProduct(product));
});
