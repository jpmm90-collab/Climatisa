-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COTIZADOR');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "btu" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_kits" (
    "id" TEXT NOT NULL,
    "min_meters" DECIMAL(6,2) NOT NULL,
    "max_meters" DECIMAL(6,2),
    "price" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "installation_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complexities" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adjustment" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "complexities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "commercial_terms" VARCHAR(2000),
    "default_deposit_percentage" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_number_counters" (
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_number_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quote_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "deposit_percentage" DECIMAL(5,2) NOT NULL,
    "deposit_amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "installation_notes_extra" VARCHAR(500),
    "additional_description" VARCHAR(500),
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_areas" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "area_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quote_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_area_equipment" (
    "id" TEXT NOT NULL,
    "quote_area_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "meters" DECIMAL(6,2) NOT NULL,
    "installation_kit_id" TEXT NOT NULL,
    "complexity_id" TEXT NOT NULL,
    "equipment_name_snapshot" TEXT NOT NULL,
    "equipment_price_snapshot" DECIMAL(12,2) NOT NULL,
    "installation_kit_price_snapshot" DECIMAL(12,2) NOT NULL,
    "complexity_adjustment_snapshot" DECIMAL(12,2) NOT NULL,
    "installation_price_snapshot" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quote_area_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_extras" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quote_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "complexities_level_key" ON "complexities"("level");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quote_number_key" ON "quotes"("quote_number");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_areas" ADD CONSTRAINT "quote_areas_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_area_equipment" ADD CONSTRAINT "quote_area_equipment_quote_area_id_fkey" FOREIGN KEY ("quote_area_id") REFERENCES "quote_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_area_equipment" ADD CONSTRAINT "quote_area_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_area_equipment" ADD CONSTRAINT "quote_area_equipment_installation_kit_id_fkey" FOREIGN KEY ("installation_kit_id") REFERENCES "installation_kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_area_equipment" ADD CONSTRAINT "quote_area_equipment_complexity_id_fkey" FOREIGN KEY ("complexity_id") REFERENCES "complexities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_extras" ADD CONSTRAINT "quote_extras_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
