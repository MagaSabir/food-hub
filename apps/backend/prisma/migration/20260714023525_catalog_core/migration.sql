-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "cuisine_types" TEXT[],
    "slug" TEXT NOT NULL,
    "show_in_catalog" BOOLEAN NOT NULL DEFAULT true,
    "rating_food" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_delivery" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "working_hours" JSONB NOT NULL,
    "has_delivery" BOOLEAN NOT NULL DEFAULT true,
    "has_dine_in" BOOLEAN NOT NULL DEFAULT true,
    "has_pickup" BOOLEAN NOT NULL DEFAULT true,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_base_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_included_radius_km" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "delivery_per_km" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_max_radius_km" DECIMAL(5,2),
    "free_delivery_min_order" DECIMAL(10,2),
    "accepting_orders" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE INDEX "branches_city_id_idx" ON "branches"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_restaurant_id_name_key" ON "branches"("restaurant_id", "name");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
