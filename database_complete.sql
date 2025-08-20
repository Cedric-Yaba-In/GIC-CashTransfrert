-- GIC CashTransfer Complete Database Script
-- Based on Prisma schema and seed.ts

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS gic_cash_transfert;
CREATE DATABASE gic_cash_transfert CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gic_cash_transfert;

-- Create Tables based on Prisma schema
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('ADMIN','VIEWER') NOT NULL DEFAULT 'ADMIN',
  `name` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
);

CREATE TABLE `regions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `regions_name_key` (`name`),
  UNIQUE KEY `regions_code_key` (`code`)
);

CREATE TABLE `countries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `code` varchar(10) NOT NULL,
  `currency` varchar(100) NOT NULL,
  `currencyCode` varchar(10) NOT NULL,
  `flag` varchar(191) NOT NULL,
  `callingCode` varchar(10) DEFAULT NULL,
  `regionId` int DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `countries_code_key` (`code`),
  KEY `countries_regionId_fkey` (`regionId`)
);

CREATE TABLE `banks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `code` varchar(20) NOT NULL,
  `countryCode` varchar(10) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `swiftCode` varchar(20) DEFAULT NULL,
  `routingNumber` varchar(50) DEFAULT NULL,
  `source` varchar(20) NOT NULL DEFAULT 'MANUAL',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `banks_code_countryCode_key` (`code`,`countryCode`),
  KEY `banks_countryCode_fkey` (`countryCode`)
);

CREATE TABLE `payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `type` enum('API','MANUAL','FLUTTERWAVE','CINETPAY','BANK_TRANSFER','MOBILE_MONEY') NOT NULL,
  `category` enum('HYBRID','BANK_TRANSFER','MOBILE_MONEY') NOT NULL DEFAULT 'HYBRID',
  `subType` varchar(50) DEFAULT NULL,
  `bankId` int DEFAULT NULL,
  `minAmount` decimal(65,30) NOT NULL DEFAULT '0',
  `maxAmount` decimal(65,30) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `isGlobal` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_methods_bankId_fkey` (`bankId`)
);

CREATE TABLE `country_payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `paymentMethodId` int NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `minAmount` decimal(65,30) DEFAULT NULL,
  `maxAmount` decimal(65,30) DEFAULT NULL,
  `fees` decimal(65,30) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `country_payment_methods_countryId_paymentMethodId_key` (`countryId`,`paymentMethodId`),
  KEY `country_payment_methods_paymentMethodId_fkey` (`paymentMethodId`)
);

CREATE TABLE `wallets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `balance` decimal(65,30) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wallets_countryId_key` (`countryId`)
);

CREATE TABLE `sub_wallets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `walletId` int NOT NULL,
  `countryPaymentMethodId` int NOT NULL,
  `balance` decimal(65,30) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `readOnly` tinyint(1) NOT NULL DEFAULT '0',
  `bankId` int DEFAULT NULL,
  `accountNumber` varchar(50) DEFAULT NULL,
  `accountName` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_wallets_countryPaymentMethodId_key` (`countryPaymentMethodId`),
  KEY `sub_wallets_walletId_fkey` (`walletId`),
  KEY `sub_wallets_bankId_fkey` (`bankId`)
);

CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(100) NOT NULL,
  `senderName` varchar(191) NOT NULL,
  `senderEmail` varchar(191) NOT NULL,
  `senderPhone` varchar(50) NOT NULL,
  `senderCountryId` int NOT NULL,
  `receiverName` varchar(191) NOT NULL,
  `receiverEmail` varchar(191) DEFAULT NULL,
  `receiverPhone` varchar(50) NOT NULL,
  `receiverCountryId` int NOT NULL,
  `amount` decimal(65,30) NOT NULL,
  `fees` decimal(65,30) NOT NULL DEFAULT '0',
  `totalAmount` decimal(65,30) NOT NULL,
  `senderPaymentMethodId` int NOT NULL,
  `receiverPaymentMethodId` int DEFAULT NULL,
  `status` enum('PENDING','PAID','APPROVED','REJECTED','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `paymentProof` varchar(191) DEFAULT NULL,
  `flutterwaveRef` varchar(191) DEFAULT NULL,
  `cinetpayRef` varchar(191) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `receiverSubMethod` varchar(50) DEFAULT NULL,
  `adminNotes` text,
  `sentAt` datetime(3) DEFAULT NULL,
  `receivedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_reference_key` (`reference`),
  KEY `transactions_senderCountryId_fkey` (`senderCountryId`),
  KEY `transactions_receiverCountryId_fkey` (`receiverCountryId`),
  KEY `transactions_senderPaymentMethodId_fkey` (`senderPaymentMethodId`),
  KEY `transactions_receiverPaymentMethodId_fkey` (`receiverPaymentMethodId`)
);

CREATE TABLE `configurations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  `category` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `label` varchar(191) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `encrypted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `configurations_key_key` (`key`)
);

CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transactionId` int DEFAULT NULL,
  `subject` varchar(191) NOT NULL,
  `status` enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `priority` enum('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `tickets_transactionId_fkey` (`transactionId`)
);

CREATE TABLE `ticket_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticketId` int NOT NULL,
  `message` text NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `adminId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ticket_messages_ticketId_fkey` (`ticketId`),
  KEY `ticket_messages_adminId_fkey` (`adminId`)
);

CREATE TABLE `transfer_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `description` text,
  `baseFee` decimal(65,30) NOT NULL DEFAULT '0',
  `percentageFee` decimal(65,30) NOT NULL DEFAULT '0',
  `minAmount` decimal(65,30) NOT NULL DEFAULT '0',
  `maxAmount` decimal(65,30) DEFAULT NULL,
  `exchangeRateMargin` decimal(65,30) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

CREATE TABLE `country_transfer_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `transferRateId` int NOT NULL,
  `baseFee` decimal(65,30) DEFAULT NULL,
  `percentageFee` decimal(65,30) DEFAULT NULL,
  `minAmount` decimal(65,30) DEFAULT NULL,
  `maxAmount` decimal(65,30) DEFAULT NULL,
  `exchangeRateMargin` decimal(65,30) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `country_transfer_rates_countryId_transferRateId_key` (`countryId`,`transferRateId`),
  KEY `country_transfer_rates_transferRateId_fkey` (`transferRateId`)
);

CREATE TABLE `transfer_corridors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `senderCountryId` int NOT NULL,
  `receiverCountryId` int NOT NULL,
  `transferRateId` int DEFAULT NULL,
  `baseFee` decimal(65,30) DEFAULT NULL,
  `percentageFee` decimal(65,30) DEFAULT NULL,
  `minAmount` decimal(65,30) DEFAULT NULL,
  `maxAmount` decimal(65,30) DEFAULT NULL,
  `exchangeRateMargin` decimal(65,30) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_corridors_senderCountryId_receiverCountryId_key` (`senderCountryId`,`receiverCountryId`),
  KEY `transfer_corridors_receiverCountryId_fkey` (`receiverCountryId`),
  KEY `transfer_corridors_transferRateId_fkey` (`transferRateId`)
);

CREATE TABLE `exchange_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fromCurrency` varchar(10) NOT NULL,
  `toCurrency` varchar(10) NOT NULL,
  `rate` decimal(18,8) NOT NULL,
  `source` varchar(50) NOT NULL,
  `lastUpdated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `exchange_rates_fromCurrency_toCurrency_key` (`fromCurrency`,`toCurrency`)
);

CREATE TABLE `bank_configurations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bankId` int NOT NULL,
  `accountNumber` varchar(50) NOT NULL,
  `accountName` varchar(191) NOT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `beneficiaryAddress` text,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_configurations_bankId_key` (`bankId`)
);

CREATE TABLE `bank_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bankId` int NOT NULL,
  `countryId` int NOT NULL,
  `accountName` varchar(191) NOT NULL,
  `accountNumber` varchar(191) NOT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `swiftCode` varchar(20) DEFAULT NULL,
  `routingNumber` varchar(50) DEFAULT NULL,
  `branchCode` varchar(20) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_accounts_bankId_countryId_key` (`bankId`,`countryId`),
  KEY `bank_accounts_countryId_fkey` (`countryId`)
);

SET FOREIGN_KEY_CHECKS = 1;

-- Insert seed data based on seed.ts

-- Insert admin user (password: admin123)
INSERT INTO `users` (`email`, `password`, `name`, `role`) VALUES
('admin@gicpromoteltd.com', '$2b$10$rQZ8kHWKQOueCQkZvdfeHOKtLfbZbZH4tQZ8kHWKQOueCQkZvdfeHO', 'Administrateur GIC', 'ADMIN');

-- Insert regions
INSERT INTO `regions` (`name`, `code`, `active`) VALUES
('Europe', 'europe', 1),
('Afrique', 'africa', 1),
('Amériques', 'americas', 1),
('Asie', 'asia', 1),
('Océanie', 'oceania', 1);

-- Insert payment methods
INSERT INTO `payment_methods` (`name`, `type`, `category`, `minAmount`, `maxAmount`, `active`) VALUES
('Flutterwave', 'FLUTTERWAVE', 'HYBRID', 10, 10000000, 1),
('CinetPay', 'CINETPAY', 'HYBRID', 1000, 10000000, 1),
('Mobile Money', 'MOBILE_MONEY', 'MOBILE_MONEY', 5, 1000000, 1),
('Virement bancaire', 'BANK_TRANSFER', 'BANK_TRANSFER', 50, 10000000, 1);

-- Insert configurations
INSERT INTO `configurations` (`key`, `value`, `category`, `type`, `label`, `required`, `encrypted`) VALUES
('APP_NAME', 'GIC CashTransfer', 'app', 'STRING', 'Nom de l\'application', 1, 0),
('APP_URL', 'http://localhost:3000', 'app', 'STRING', 'URL de l\'application', 1, 0),
('COMPANY_NAME', 'GIC Promote LTD', 'app', 'STRING', 'Nom de l\'entreprise', 1, 0),
('SUPPORT_EMAIL', 'support@gicpromoteltd.com', 'app', 'STRING', 'Email de support', 1, 0),
('EMAIL_HOST', 'smtp.gmail.com', 'email', 'STRING', 'Serveur SMTP', 1, 0),
('EMAIL_PORT', '587', 'email', 'NUMBER', 'Port SMTP', 1, 0),
('EMAIL_USER', '', 'email', 'STRING', 'Utilisateur SMTP', 1, 0),
('EMAIL_PASS', '', 'email', 'PASSWORD', 'Mot de passe SMTP', 1, 1),
('EMAIL_FROM', 'noreply@gicpromoteltd.com', 'email', 'STRING', 'Email expéditeur', 1, 0),
('TWILIO_ACCOUNT_SID', '', 'sms', 'STRING', 'Twilio Account SID', 0, 0),
('TWILIO_AUTH_TOKEN', '', 'sms', 'PASSWORD', 'Twilio Auth Token', 0, 1),
('TWILIO_PHONE_NUMBER', '', 'sms', 'STRING', 'Numéro Twilio', 0, 0),
('FLUTTERWAVE_PUBLIC_KEY', '', 'payment', 'STRING', 'Flutterwave Public Key', 0, 0),
('FLUTTERWAVE_SECRET_KEY', '', 'payment', 'PASSWORD', 'Flutterwave Secret Key', 0, 1),
('FLUTTERWAVE_WEBHOOK_HASH', '', 'payment', 'PASSWORD', 'Flutterwave Webhook Hash', 0, 1),
('FLUTTERWAVE_ENCRYPTION_KEY', '', 'payment', 'PASSWORD', 'Flutterwave Encryption Key', 0, 1),
('CINETPAY_API_KEY', '', 'cinetpay', 'PASSWORD', 'Clé API CinetPay', 0, 1),
('CINETPAY_SITE_ID', '', 'cinetpay', 'PASSWORD', 'Site ID CinetPay', 0, 1),
('CINETPAY_SECRET_KEY', '', 'cinetpay', 'PASSWORD', 'Clé secrète CinetPay', 0, 1),
('CINETPAY_API_PASSWORD', '', 'cinetpay', 'PASSWORD', 'Mot de passe API CinetPay', 0, 1),
('CINETPAY_NOTIFY_URL', 'http://localhost:3000/api/cinetpay/callback', 'cinetpay', 'STRING', 'URL de notification CinetPay', 0, 0),
('RESTCOUNTRIES_API_URL', 'https://restcountries.com/v3.1', 'api', 'STRING', 'RestCountries API URL', 1, 0),
('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production', 'security', 'PASSWORD', 'JWT Secret', 1, 1),
('ENCRYPTION_KEY', 'your-32-char-encryption-key-here', 'security', 'PASSWORD', 'Clé de chiffrement', 1, 1),
('DEFAULT_TRANSACTION_FEE', '2.5', 'business', 'NUMBER', 'Frais de transaction par défaut', 1, 0),
('MIN_TRANSACTION_AMOUNT', '1', 'business', 'NUMBER', 'Montant minimum de transaction', 1, 0),
('MAX_TRANSACTION_AMOUNT', '50000', 'business', 'NUMBER', 'Montant maximum de transaction', 1, 0),
('AUTO_APPROVE_LIMIT', '1000', 'business', 'NUMBER', 'Limite approbation automatique', 1, 0);

-- Insert banks from bank-seeds.ts
INSERT INTO `banks` (`name`, `code`, `countryCode`, `logo`, `website`, `swiftCode`, `routingNumber`, `source`) VALUES
('BNP Paribas', 'BNPPARIBAS', 'FR', 'https://logos-world.net/wp-content/uploads/2021/02/BNP-Paribas-Logo.png', 'https://www.bnpparibas.fr', 'BNPAFRPP', NULL, 'MANUAL'),
('Crédit Agricole', 'CREDITAGRICOLE', 'FR', 'https://logos-world.net/wp-content/uploads/2021/02/Credit-Agricole-Logo.png', 'https://www.credit-agricole.fr', 'AGRIFRPP', NULL, 'MANUAL'),
('Société Générale', 'SOCIETEGENERALE', 'FR', 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png', 'https://www.societegenerale.fr', 'SOGEFRPP', NULL, 'MANUAL'),
('JPMorgan Chase', 'CHASE', 'US', 'https://logos-world.net/wp-content/uploads/2021/02/JPMorgan-Chase-Logo.png', 'https://www.chase.com', 'CHASUS33', '021000021', 'MANUAL'),
('Bank of America', 'BOA', 'US', 'https://logos-world.net/wp-content/uploads/2021/02/Bank-of-America-Logo.png', 'https://www.bankofamerica.com', 'BOFAUS3N', '011000138', 'MANUAL'),
('Barclays', 'BARCLAYS', 'GB', 'https://logos-world.net/wp-content/uploads/2021/02/Barclays-Logo.png', 'https://www.barclays.co.uk', 'BARCGB22', NULL, 'MANUAL'),
('HSBC UK', 'HSBC', 'GB', 'https://logos-world.net/wp-content/uploads/2021/02/HSBC-Logo.png', 'https://www.hsbc.co.uk', 'HBUKGB4B', NULL, 'MANUAL'),
('Deutsche Bank', 'DEUTSCHEBANK', 'DE', 'https://logos-world.net/wp-content/uploads/2021/02/Deutsche-Bank-Logo.png', 'https://www.deutsche-bank.de', 'DEUTDEFF', NULL, 'MANUAL'),
('Royal Bank of Canada', 'RBC', 'CA', 'https://logos-world.net/wp-content/uploads/2021/02/RBC-Logo.png', 'https://www.rbc.com', 'ROYCCAT2', NULL, 'MANUAL'),
('Commonwealth Bank', 'CBA', 'AU', 'https://logos-world.net/wp-content/uploads/2021/02/Commonwealth-Bank-Logo.png', 'https://www.commbank.com.au', 'CTBAAU2S', NULL, 'MANUAL'),
('Banque de l\'Habitat du Sénégal', 'BHS', 'SN', 'https://www.bhs.sn/images/logo.png', 'https://www.bhs.sn', 'BHSNSNDX', NULL, 'MANUAL'),
('Société Générale Sénégal', 'SGSN', 'SN', 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png', 'https://www.societegenerale.sn', 'SOGESNDX', NULL, 'MANUAL'),
('Ecobank Sénégal', 'ECOSN', 'SN', 'https://ecobank.com/uploads/logos/ecobank-logo.png', 'https://ecobank.com', 'ECOSNSNDX', NULL, 'MANUAL'),
('CBAO Groupe Attijariwafa Bank', 'CBAO', 'SN', 'https://www.cbao.sn/images/logo.png', 'https://www.cbao.sn', 'CBAOSNDX', NULL, 'MANUAL'),
('Société Générale Côte d\'Ivoire', 'SGCI', 'CI', 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png', 'https://www.societegenerale.ci', 'SOGECIDX', NULL, 'MANUAL'),
('Ecobank Côte d\'Ivoire', 'ECOCI', 'CI', 'https://ecobank.com/uploads/logos/ecobank-logo.png', 'https://ecobank.com', 'ECOCIDX', NULL, 'MANUAL'),
('Banque Atlantique Côte d\'Ivoire', 'BACI', 'CI', 'https://www.banqueatlantique.net/images/logo.png', 'https://www.banqueatlantique.net', 'ATBKCIDX', NULL, 'MANUAL'),
('UBA Côte d\'Ivoire', 'UBACI', 'CI', 'https://www.ubagroup.com/images/uba-logo.png', 'https://www.ubagroup.com', 'UNAFCIDX', NULL, 'MANUAL'),
('Afriland First Bank', 'AFRILAND', 'CM', 'https://www.afrilandfirstbank.com/images/logo.png', 'https://www.afrilandfirstbank.com', 'CCBKCMCX', NULL, 'MANUAL'),
('Banque Atlantique Cameroun', 'BACM', 'CM', 'https://www.banqueatlantique.net/images/logo.png', 'https://www.banqueatlantique.net', 'ATBKCMCX', NULL, 'MANUAL'),
('Commercial Bank of Cameroon', 'CBC', 'CM', 'https://www.cbccameroon.com/images/logo.png', 'https://www.cbccameroon.com', 'CBCMCMCX', NULL, 'MANUAL'),
('Ecobank Cameroun', 'ECOBANK', 'CM', 'https://ecobank.com/uploads/logos/ecobank-logo.png', 'https://ecobank.com', 'ECOCCMCX', NULL, 'MANUAL'),
('Standard Chartered Bank Cameroon', 'SCB', 'CM', 'https://av.sc.com/corp-en/content/images/scb-logo.png', 'https://www.sc.com/cm', 'SCBLCMCX', NULL, 'MANUAL'),
('United Bank for Africa Cameroon', 'UBA', 'CM', 'https://www.ubagroup.com/images/uba-logo.png', 'https://www.ubagroup.com', 'UNAFCMCX', NULL, 'MANUAL'),
('Société Générale Cameroun', 'SGCM', 'CM', 'https://logos-world.net/wp-content/uploads/2021/02/Societe-Generale-Logo.png', 'https://www.societegenerale.cm', 'SOGECMCX', NULL, 'MANUAL');

-- Insert default transfer rate
INSERT INTO `transfer_rates` (`name`, `description`, `baseFee`, `percentageFee`, `minAmount`, `maxAmount`, `exchangeRateMargin`, `active`, `isDefault`) VALUES
('Standard International', 'Taux de transfert standard pour tous les pays (devise de base: USD)', 5.0, 2.0, 1.0, 10000.0, 1.0, 1, 1);

COMMIT;