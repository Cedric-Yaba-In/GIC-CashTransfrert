-- Migration pour ajouter la structure de catégorisation des méthodes de paiement

-- Ajouter les nouvelles colonnes à PaymentMethod
ALTER TABLE payment_methods 
ADD COLUMN category ENUM('HYBRID', 'BANK_TRANSFER', 'MOBILE_MONEY') DEFAULT 'HYBRID' AFTER type,
ADD COLUMN subType VARCHAR(50) NULL AFTER category,
ADD COLUMN bankId INT NULL AFTER subType;

-- Ajouter la relation avec Bank
ALTER TABLE payment_methods 
ADD CONSTRAINT fk_payment_method_bank 
FOREIGN KEY (bankId) REFERENCES banks(id) ON DELETE SET NULL;

-- Mettre à jour les types existants
UPDATE payment_methods SET category = 'HYBRID' WHERE type = 'FLUTTERWAVE';
UPDATE payment_methods SET category = 'BANK_TRANSFER', subType = 'BANK' WHERE type = 'BANK_TRANSFER';
UPDATE payment_methods SET category = 'MOBILE_MONEY' WHERE type = 'MOBILE_MONEY';

-- Ajouter le nouveau type MOBILE_MONEY à l'enum
ALTER TABLE payment_methods 
MODIFY COLUMN type ENUM('API', 'MANUAL', 'FLUTTERWAVE', 'BANK_TRANSFER', 'MOBILE_MONEY');

-- Ajouter la relation PaymentMethod -> Bank
ALTER TABLE banks 
ADD INDEX idx_banks_country (countryCode);