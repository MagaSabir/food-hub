-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "photos" TEXT[];

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "details" TEXT,
    "locality" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_addresses_user_id_created_at_idx" ON "user_addresses"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
