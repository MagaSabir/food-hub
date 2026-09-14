/*
  Warnings:

  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "staff_users" DROP CONSTRAINT "staff_users_branch_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
