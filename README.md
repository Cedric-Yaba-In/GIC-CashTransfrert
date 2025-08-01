# GIC CashTransfer

Application de transfert d'argent international développée par GIC Promote LTD.

## 🚀 Fonctionnalités

- **Transfert sans compte** : Envoi d'argent sans création de compte
- **Gestion multi-pays** : Support de multiples pays avec devises
- **Moyens de paiement dynamiques** : Flutterwave, Mobile Money, Virement bancaire
- **Interface admin** : Validation et gestion des transactions
- **Système de tickets** : Support client intégré
- **Notifications** : Email et SMS automatiques
- **Suivi en temps réel** : Interface publique de suivi
- **Multilingue** : Support FR/EN

## 🛠️ Technologies

- **Frontend/Backend** : Next.js 14 (App Router)
- **Base de données** : MySQL avec Prisma ORM
- **Styling** : Tailwind CSS
- **Authentification** : JWT
- **Email** : Nodemailer
- **SMS** : Twilio
- **Paiements** : Flutterwave API

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd gic-cashtransfer
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration environnement**
```bash
cp .env.example .env
```
Remplir les variables dans `.env`

4. **Base de données**
```bash
npm run db:push
npm run db:generate
npm run db:seed
```

5. **Démarrer l'application**
```bash
npm run dev
```

## 🔧 Configuration

### Variables d'environnement requises

- `DATABASE_URL` : URL de connexion MySQL
- `JWT_SECRET` : Clé secrète JWT
- `FLUTTERWAVE_PUBLIC_KEY` : Clé publique Flutterwave
- `FLUTTERWAVE_SECRET_KEY` : Clé secrète Flutterwave
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` : Configuration email
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` : Configuration SMS

## 📱 Utilisation

### Interface publique
- **/** : Page d'accueil
- **/transfer** : Nouveau transfert
- **/track** : Suivi de transaction
- **/support** : Support client

### Interface admin
- **/admin** : Dashboard administrateur
- **/admin/transactions** : Gestion des transactions
- **/admin/countries** : Gestion des pays
- **/admin/wallets** : Gestion des portefeuilles

## 🔐 Authentification Admin

Compte par défaut :
- Email: `admin@gicpromoteltd.com`
- Mot de passe: `admin123`

## 📊 Structure de la base

- **Users** : Utilisateurs administrateurs
- **Countries** : Pays supportés
- **PaymentMethods** : Moyens de paiement
- **Transactions** : Transferts d'argent
- **Wallets/SubWallets** : Gestion des soldes
- **Tickets** : Support client
- **AuditLogs** : Journalisation

## 🚀 Déploiement

1. **Build de production**
```bash
npm run build
```

2. **Démarrer en production**
```bash
npm start
```

## 📞 Support

Pour toute question ou support technique :
- Email: support@gicpromoteltd.com
- Site web: [GIC Promote LTD](https://gicpromoteltd.com)

## 📄 Licence

© 2024 GIC Promote LTD. Tous droits réservés.