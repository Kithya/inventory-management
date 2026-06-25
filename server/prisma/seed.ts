import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelNameByFileName: Record<string, string> = {
  "purchaseSummary.json": "purchaseSummary",
  "users.json": "user",
};

function getModelName(fileName: string) {
  return (
    modelNameByFileName[fileName] ??
    path.basename(fileName, path.extname(fileName))
  );
}

function transformData(fileName: string, data: Record<string, unknown>) {
  if (fileName === "users.json") {
    const userId = String(data.userId);
    return {
      ...data,
      authProvider: "seed",
      authSubject: `seed|${userId}`,
      role: "USER",
      status: "ACTIVE",
    };
  }

  if (fileName === "expenseSummary.json") {
    const { totalExpenses, ...rest } = data;
    return {
      ...rest,
      totalValue: totalExpenses,
    };
  }

  if (fileName === "purchases.json") {
    const { unitCost, totalCost, ...rest } = data;
    const quantity = Number(data.quantity);
    const unitPrice = Number(unitCost);
    return {
      ...rest,
      unitPrice: unitCost,
      totalAmount: Number.isFinite(quantity * unitPrice)
        ? Number((quantity * unitPrice).toFixed(2))
        : totalCost,
    };
  }

  if (fileName === "sales.json") {
    const quantity = Number(data.quantity);
    const unitPrice = Number(data.unitPrice);
    return {
      ...data,
      totalAmount: Number.isFinite(quantity * unitPrice)
        ? Number((quantity * unitPrice).toFixed(2))
        : data.totalAmount,
    };
  }

  return data;
}

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map(getModelName).reverse();

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    if (model) {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelName}`);
    } else {
      console.error(
        `Model ${modelName} not found. Please ensure the model name is correctly specified.`,
      );
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  const orderedFileNames = [
    "products.json",
    "expenseSummary.json",
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "users.json",
    "expenses.json",
    "expenseByCategory.json",
  ];

  await deleteAllData(orderedFileNames);

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = getModelName(fileName);
    const model: any = prisma[modelName as keyof typeof prisma];

    if (!model) {
      console.error(`No Prisma model matches the file name: ${fileName}`);
      continue;
    }

    for (const data of jsonData) {
      await model.create({
        data: transformData(fileName, data),
      });
    }

    console.log(`Seeded ${modelName} with data from ${fileName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
