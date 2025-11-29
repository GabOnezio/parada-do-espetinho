-- AlterTable
ALTER TABLE `Product` ADD COLUMN `measureUnit` VARCHAR(191) NOT NULL DEFAULT 'kg',
    MODIFY `gtin` VARCHAR(191) NULL;
