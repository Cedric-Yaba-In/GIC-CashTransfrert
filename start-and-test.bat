@echo off
echo Démarrage du serveur Next.js...
start "Next.js Server" cmd /k "cd /d f:\Personnel\Projet\GIC CashTransfrert && npm run dev"

echo Attente de 10 secondes pour que le serveur démarre...
timeout /t 10 /nobreak

echo Test de l'API des banques...
node test-http-banks.js

pause