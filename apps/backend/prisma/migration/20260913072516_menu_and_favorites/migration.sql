-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('DISH', 'DRINK');

-- CreateEnum
CREATE TYPE "ModifierType" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL DEFAULT 'DISH',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "composition" TEXT,
    "weight" TEXT,
    "volume" TEXT,
    "calories" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "discount_price" DECIMAL(10,2),
    "discount_until" TIMESTAMP(3),
    "photos" TEXT[],
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ModifierType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_restaurant_id_name_key" ON "menu_categories"("restaurant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_id_restaurant_id_key" ON "menu_categories"("id", "restaurant_id");

-- CreateIndex
CREATE INDEX "menu_items_category_id_sort_order_idx" ON "menu_items"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_items_restaurant_id_idx" ON "menu_items"("restaurant_id");

-- CreateIndex
CREATE INDEX "modifier_groups_menu_item_id_sort_order_idx" ON "modifier_groups"("menu_item_id", "sort_order");

-- CreateIndex
CREATE INDEX "modifier_options_modifier_group_id_sort_order_idx" ON "modifier_options"("modifier_group_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_favorites_restaurant_id_idx" ON "user_favorites"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_restaurant_id_key" ON "user_favorites"("user_id", "restaurant_id");

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_restaurant_id_fkey" FOREIGN KEY ("category_id", "restaurant_id") REFERENCES "menu_categories"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
