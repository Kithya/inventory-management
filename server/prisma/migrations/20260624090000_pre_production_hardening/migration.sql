CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

ALTER TABLE "User"
  ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'seed',
  ADD COLUMN "authSubject" TEXT,
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User"
SET "authSubject" = 'seed|' || "userId"
WHERE "authSubject" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "authSubject" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_authSubject_key" ON "User"("authSubject");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

ALTER TABLE "Products"
  ALTER COLUMN "productId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "price" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Products_name_idx" ON "Products"("name");
CREATE INDEX "Products_stockQuantity_idx" ON "Products"("stockQuantity");

ALTER TABLE "Sales"
  ALTER COLUMN "saleId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12, 2),
  ALTER COLUMN "totalAmount" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Sales_productId_timestamp_idx" ON "Sales"("productId", "timestamp");
CREATE INDEX "Sales_timestamp_idx" ON "Sales"("timestamp");

ALTER TABLE "Purchases"
  ALTER COLUMN "purchaseId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12, 2),
  ALTER COLUMN "totalAmount" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Purchases_productId_timestamp_idx" ON "Purchases"("productId", "timestamp");
CREATE INDEX "Purchases_timestamp_idx" ON "Purchases"("timestamp");

ALTER TABLE "Expenses"
  ALTER COLUMN "expenseId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Expenses_category_timestamp_idx" ON "Expenses"("category", "timestamp");

ALTER TABLE "SalesSummary"
  ALTER COLUMN "salesSummaryId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "totalValue" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "SalesSummary_date_idx" ON "SalesSummary"("date");

ALTER TABLE "PurchaseSummary"
  ALTER COLUMN "purchaseSummaryId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "totalPurchased" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "PurchaseSummary_date_idx" ON "PurchaseSummary"("date");

ALTER TABLE "ExpenseSummary"
  ALTER COLUMN "expenseSummaryId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "totalValue" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ExpenseSummary_date_idx" ON "ExpenseSummary"("date");

ALTER TABLE "ExpenseByCategory"
  ALTER COLUMN "expenseByCategoryId" SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ExpenseByCategory_category_date_idx" ON "ExpenseByCategory"("category", "date");
CREATE INDEX "ExpenseByCategory_expenseSummaryId_idx" ON "ExpenseByCategory"("expenseSummaryId");
