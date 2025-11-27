-- CreateTable
CREATE TABLE `PaymentConfig` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NULL,
    `mpAccessToken` VARCHAR(191) NULL,
    `mpPublicKey` VARCHAR(191) NULL,
    `mpWebhookSecret` VARCHAR(191) NULL,
    `mpNotificationUrl` VARCHAR(191) NULL,
    `terminalLabel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentConfig_storeId_key`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
