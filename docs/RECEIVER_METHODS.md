# Système de Moyens de Réception - GIC CashTransfer

## Vue d'ensemble

Le système permet maintenant de sélectionner spécifiquement le moyen de réception pour le destinataire, en fonction des fonds disponibles dans les portefeuilles du pays de destination.

## Fonctionnement

### 1. Sélection du moyen d'envoi
- L'expéditeur choisit parmi les moyens disponibles dans son pays
- Vérification que le pays de destination a suffisamment de fonds

### 2. Sélection du moyen de réception
- Affichage des moyens ayant suffisamment de solde pour le montant à recevoir
- Chaque moyen affiche son solde disponible
- Sélection obligatoire avant de continuer

### 3. Saisie des coordonnées de réception
- Selon le type choisi, demande des informations spécifiques :
  - **Mobile Money** : Numéro de téléphone
  - **Virement bancaire** : Nom, numéro de compte, code banque
  - **Flutterwave** : Numéro de téléphone + options disponibles

## Types de réception supportés

### Mobile Money
- Orange Money, MTN Money, Moov Money, etc.
- Nécessite le numéro de téléphone du destinataire
- Transfert direct vers le portefeuille mobile

### Virement bancaire
- Vers n'importe quelle banque du pays de destination
- Nécessite : nom du titulaire, numéro de compte, code banque
- Vérification possible du compte via Flutterwave

### Flutterwave
- Options multiples selon le pays :
  - Mobile Money local
  - Compte bancaire
  - Portefeuille Flutterwave
- Le destinataire choisit lors de la réception

## API Endpoints

### `/api/transfer/receiver-methods`
Récupère les moyens de réception disponibles pour un pays et montant donnés.

**Paramètres :**
- `receiverCountryId` : ID du pays de destination
- `amount` : Montant que le destinataire recevra

**Réponse :**
```json
[
  {
    "paymentMethodId": "1",
    "paymentMethodName": "Orange Money",
    "paymentMethodType": "MOBILE_MONEY",
    "balance": 5000.00,
    "minAmount": 1,
    "maxAmount": 1000,
    "countryName": "Côte d'Ivoire",
    "currencyCode": "XOF",
    "available": true
  }
]
```

### `/api/flutterwave/payment-methods`
Récupère les options Flutterwave disponibles pour une devise.

## Flux utilisateur

1. **Page de transfert** : Sélection du moyen de réception après avoir choisi les pays et le montant
2. **Page de paiement** : Saisie des coordonnées selon le type de réception choisi
3. **Traitement** : Création de la transaction avec les informations complètes

## Gestion des soldes

- Vérification en temps réel des soldes disponibles
- Seuls les moyens avec suffisamment de fonds sont proposés
- Mise à jour automatique des soldes après transaction

## Configuration

Pour ajouter un nouveau moyen de réception :

1. Créer la méthode de paiement dans la base
2. L'associer au pays via `CountryPaymentMethod`
3. Créer le sous-portefeuille avec un solde initial
4. Le moyen apparaîtra automatiquement dans les options

## Sécurité

- Validation des montants et soldes
- Vérification des comptes bancaires (si Flutterwave activé)
- Sanitisation de toutes les entrées utilisateur
- Logs sécurisés des transactions