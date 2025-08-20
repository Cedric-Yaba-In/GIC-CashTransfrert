# Intégration Flutterwave - GIC CashTransfer

## Vue d'ensemble

Cette intégration complète de Flutterwave permet :
- **Paiements entrants** : Les utilisateurs peuvent payer via Flutterwave (cartes, mobile money, etc.)
- **Transferts sortants** : Envoi automatique des fonds aux destinataires
- **Gestion multi-pays** : Support des différentes devises et méthodes par pays
- **Vérification de comptes** : Validation des comptes bancaires avant transfert

## Configuration

### Variables d'environnement requises

```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Initialisation

1. **Installer les méthodes de paiement Flutterwave** :
```bash
npm run flutterwave:init
```

2. **Synchroniser les banques par pays** (via API) :
```bash
POST /api/flutterwave/sync-banks
{
  "countryCode": "NG"
}
```

## Flux de paiement complet

### 1. Sélection de Flutterwave
- L'utilisateur choisit Flutterwave comme méthode de paiement
- Le système vérifie la disponibilité pour le pays d'envoi
- Affichage des méthodes supportées (carte, mobile money, etc.)

### 2. Création de la transaction
- Transaction créée en base avec statut PENDING
- Génération d'une référence unique
- Association avec la méthode Flutterwave

### 3. Redirection vers Flutterwave
- Création du lien de paiement sécurisé
- Redirection automatique vers l'interface Flutterwave
- L'utilisateur effectue le paiement

### 4. Traitement du callback
- Vérification du paiement avec Flutterwave
- Mise à jour du statut de transaction (PAID/FAILED)
- Mise à jour des soldes de portefeuilles

### 5. Transfert automatique (si configuré)
- Pour les méthodes automatiques (Mobile Money)
- Transfert immédiat vers le destinataire
- Statut final : COMPLETED

## Endpoints créés

### Paiements
- `POST /api/flutterwave/process-payment` - Lance le paiement
- `GET/POST /api/flutterwave/callback` - Traite les retours
- `GET /api/flutterwave/payment-methods` - Méthodes par devise

### Utilitaires
- `GET /api/flutterwave/banks` - Banques par pays
- `POST /api/flutterwave/verify-account` - Vérifie un compte
- `POST /api/flutterwave/sync-banks` - Synchronise les banques

## Pages créées

- `/transfer/payment/callback` - Redirection temporaire
- `/transfer/payment/success` - Confirmation de succès
- `/transfer/payment/failed` - Gestion des échecs

## Composants

- `FlutterwavePaymentMethods` - Affiche les méthodes disponibles
- Page de paiement modifiée pour Flutterwave

## Installation et utilisation

1. **Initialiser Flutterwave** :
```bash
npm run flutterwave:init
```

2. **Configurer les variables d'environnement**

3. **Tester avec les données de test Flutterwave**

L'intégration est maintenant complète et fonctionnelle !