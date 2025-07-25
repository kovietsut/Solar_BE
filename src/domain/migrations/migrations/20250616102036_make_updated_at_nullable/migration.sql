-- AlterTable
ALTER TABLE `auth_methods` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `roles` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `updatedAt` DATETIME(3) NULL;
