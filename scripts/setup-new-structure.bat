@echo off
echo 🚀 Configuration de la nouvelle structure de paiement...
echo.

echo 📋 Étape 1: Vider la base de données
node scripts/reset-database.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du vidage de la base de données
    pause
    exit /b 1
)

echo.
echo 📋 Étape 2: Appliquer le nouveau schéma
call npm run db:push
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'application du schéma
    pause
    exit /b 1
)

echo.
echo 📋 Étape 3: Générer le client Prisma
call npm run db:generate
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la génération du client
    pause
    exit /b 1
)

echo.
echo 📋 Étape 4: Seeder les données initiales
call npm run db:seed
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du seeding
    pause
    exit /b 1
)

echo.
echo 📋 Étape 5: Tester la nouvelle structure
node test-payment-categories.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du test
    pause
    exit /b 1
)

echo.
echo 🎉 Configuration terminée avec succès!
echo ✅ La nouvelle structure de catégorisation est opérationnelle
echo.
echo 📝 Vous pouvez maintenant:
echo    - Démarrer l'application: npm run dev
echo    - Accéder à l'admin: http://localhost:3000/admin
echo    - Tester les nouvelles catégories de paiement
echo.
pause