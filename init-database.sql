-- Créer les tables
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'VIEWER') NOT NULL DEFAULT 'ADMIN',
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `regions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `regions_name_key`(`name`),
    UNIQUE INDEX `regions_code_key`(`code`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `currency` VARCHAR(100) NOT NULL,
    `currencyCode` VARCHAR(10) NOT NULL,
    `flag` VARCHAR(191) NOT NULL,
    `callingCode` VARCHAR(10) NULL,
    `regionId` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `countries_code_key`(`code`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('API', 'MANUAL', 'FLUTTERWAVE', 'MOBILE_MONEY', 'BANK_TRANSFER') NOT NULL,
    `minAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `maxAmount` DECIMAL(65, 30) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
);

CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(100) NOT NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `senderEmail` VARCHAR(191) NOT NULL,
    `senderPhone` VARCHAR(50) NOT NULL,
    `senderCountryId` INTEGER NOT NULL,
    `receiverName` VARCHAR(191) NOT NULL,
    `receiverEmail` VARCHAR(191) NULL,
    `receiverPhone` VARCHAR(50) NOT NULL,
    `receiverCountryId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `fees` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(65, 30) NOT NULL,
    `senderPaymentMethodId` INTEGER NOT NULL,
    `receiverPaymentMethodId` INTEGER NULL,
    `status` ENUM('PENDING', 'PAID', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paymentProof` VARCHAR(191) NULL,
    `adminNotes` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `transactions_reference_key`(`reference`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `country_payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `paymentMethodId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `minAmount` DECIMAL(65, 30) NULL,
    `maxAmount` DECIMAL(65, 30) NULL,
    `fees` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `country_payment_methods_countryId_paymentMethodId_key`(`countryId`, `paymentMethodId`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `wallets_countryId_key`(`countryId`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `sub_wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `walletId` INTEGER NOT NULL,
    `countryPaymentMethodId` INTEGER NOT NULL,
    `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `sub_wallets_countryPaymentMethodId_key`(`countryPaymentMethodId`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `category` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `encrypted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `configurations_key_key`(`key`),
    PRIMARY KEY (`id`)
);

CREATE TABLE `tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
);

-- Insérer les données initiales
INSERT INTO `users` (`email`, `password`, `name`, `role`) VALUES 
('admin@gicpromoteltd.com', '$2a$10$Ps1hjDg7Jve1sqDEk4gIMe9e1b1G1y6tcvuT6xNOE.f4JL/etNXm2', 'Administrateur GIC', 'ADMIN');

INSERT INTO `regions` (`name`, `code`, `active`) VALUES 
('Europe', 'europe', true),
('Africa', 'africa', true),
('Asia', 'asia', true),
('Americas', 'americas', true),
('Oceania', 'oceania', true);

INSERT INTO `payment_methods` (`name`, `type`, `minAmount`, `maxAmount`, `active`) VALUES 
('Flutterwave', 'FLUTTERWAVE', 10, 10000, true),
('Mobile Money', 'MOBILE_MONEY', 5, 5000, true),
('Virement bancaire', 'BANK_TRANSFER', 50, 50000, true);

INSERT INTO `configurations` (`key`, `value`, `category`, `type`, `label`, `required`) VALUES 
('APP_NAME', 'GIC CashTransfer', 'app', 'STRING', 'Nom de l\'application', true),
('APP_URL', 'http://localhost:3000', 'app', 'STRING', 'URL de l\'application', true),
('COMPANY_NAME', 'GIC Promote LTD', 'app', 'STRING', 'Nom de l\'entreprise', true),
('SUPPORT_EMAIL', 'support@gicpromoteltd.com', 'app', 'STRING', 'Email de support', true),
('EMAIL_HOST', 'smtp.gmail.com', 'email', 'STRING', 'Serveur SMTP', true),
('EMAIL_PORT', '587', 'email', 'NUMBER', 'Port SMTP', true),
('EMAIL_USER', '', 'email', 'STRING', 'Utilisateur SMTP', true),
('EMAIL_PASS', '', 'email', 'PASSWORD', 'Mot de passe SMTP', true),
('EMAIL_FROM', 'noreply@gicpromoteltd.com', 'email', 'STRING', 'Email expéditeur', true),
('DEFAULT_TRANSACTION_FEE', '2.5', 'business', 'NUMBER', 'Frais de transaction par défaut', true),
('MIN_TRANSACTION_AMOUNT', '1', 'business', 'NUMBER', 'Montant minimum de transaction', true),
('MAX_TRANSACTION_AMOUNT', '50000', 'business', 'NUMBER', 'Montant maximum de transaction', true);