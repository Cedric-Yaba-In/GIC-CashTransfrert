# Instructions de configuration - GIC CashTransfer

## Configuration initiale

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de la base de données
```bash
npm run db:push
npm run db:generate
```

### 3. Initialisation des données de base
```bash
# Initialiser les taux de transfert
npm run rates:init

# Initialiser les méthodes Flutterwave
npm run flutterwave:init

# Seeder les données de base (pays, régions, etc.)
npm run db:seed
```

### 4. Variables d'environnement
Créer un fichier `.env` avec :
```env
# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/gic_cashtransfer"

# JWT
JWT_SECRET="your-jwt-secret-key"

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-xxxxx"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxxxx"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (optionnel)
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# SMS Twilio (optionnel)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
```

### 5. Démarrage de l'application
```bash
npm run dev
```

## Fonctionnalités configurées

### ✅ Transferts internationaux
- Calcul automatique des frais
- Taux de change en temps réel
- Support multi-devises

### ✅ Intégration Flutterwave
- Paiements par carte
- Mobile Money
- Transferts automatiques

### ✅ Gestion des portefeuilles
- Soldes par pays et méthode
- Mise à jour automatique

### ✅ Interface utilisateur
- Design moderne et responsive
- Formulaires multi-étapes
- Suivi des transactions

## Prochaines étapes

1. Configurer les clés Flutterwave de production
2. Ajouter plus de pays et méthodes de paiement
3. Configurer les notifications email/SMS
4. Tester les transferts en mode sandbox