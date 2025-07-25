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
    `isRevoked` BOOLEAN NOT NULL,
    `accessTokenExpiration` DATETIME(3) NOT NULL,
    `refreshTokenExpiration` DATETIME(3) NOT NULL,

    INDEX `auth_methods_userId_authType_authId_refreshTokenExpiration_idx`(`userId`, `authType`, `authId`, `refreshTokenExpiration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_methods` ADD CONSTRAINT `auth_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
