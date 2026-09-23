-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('CLIMATISA', 'CENTO');

-- AlterTable
ALTER TABLE "complexities" ADD COLUMN     "partner_adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "installation_kits" ADD COLUMN     "partner_price" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "cento_client_reference" VARCHAR(200),
ADD COLUMN     "cento_vendor_name" VARCHAR(120),
ADD COLUMN     "quote_type" "QuoteType" NOT NULL DEFAULT 'CLIMATISA';
