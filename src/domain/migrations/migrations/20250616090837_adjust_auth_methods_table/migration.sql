/*
  Warnings:

  - You are about to drop the `authmethod` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `authmethod` DROP FOREIGN KEY `AuthMethod_userId_fkey`;

-- DropTable
DROP TABLE `authmethod`;

-- CreateTable
CREATE TABLE `auth_methods` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,
    `authType` VARCHAR(191) NOT NULL,
    `authId` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `jwtId` VARCHAR(191) NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `accessTokenExpiration` DATETIME(3) NULL,
    `refreshTokenExpiration` DATETIME(3) NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,

    INDEX `auth_methods_userId_idx`(`userId`),
    INDEX `auth_methods_deviceId_idx`(`deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_methods` ADD CONSTRAINT `auth_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
