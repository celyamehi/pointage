Cahier des charges pour le site de pointage "Collable" (version mise à jour)
Contexte et objectif
Créer un site web de pointage destiné à la société « Collable » qui permettra de gérer le pointage des agents matin et après-midi via un système de scan d'un QR code unique. Le site comporte une interface web pour les agents avec une session de connexion, et un tableau de bord administrateur pour visualiser en temps réel les points.

Fonctionnalités principales
1. Gestion utilisateur
Chaque agent dispose d'un compte avec un identifiant unique (ID) et un mot de passe pour se connecter au site web.

Création, modification et suppression des agents via l'interface d'administration.

Protection des sessions utilisateurs par authentification sécurisée.

2. Pointage via scan QR code
Sur le site admin, présence d'une page "Code QR" qui génère et affiche un seul QR code unique utilisé pour les pointages.

Le code QR est affiché en grand format sur cette page pour une meilleure visibilité.

Un bouton "Imprimer le code QR" est disponible pour permettre à l'administrateur d'imprimer facilement le code QR.

Les agents, après connexion, scannent ce même QR code matin et après-midi chaque jour pour pointer.

Lors du scan, le site récupère l'ID de l'agent connecté et enregistre la date et l'heure du pointage.

Un bouton "Mettre à jour le code QR" est disponible dans l'interface d'administration pour générer un nouveau QR code unique en cas de besoin.

3. Administration du tableau de bord
Tableau de bord récapitulatif listant tous les agents avec leurs pointages matin et après-midi, dates et heures.

Possibilité de filtrer et rechercher les agents.

Option d'export des données de pointage au format CSV ou Excel.

Technique d'architecture
Backend
Langage de programmation : Rust (pour performance et sécurité).

Utilisation de Supabase comme base de données PostgreSQL et pour le service d'authentification.

Configuration de Supabase :

SUPABASE_URL= https://loaemslxftijsesuvude.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI 1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYWVtc2x4ZnRpanNlc3V2dWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDA1NTEsImV4cCI6MjA3NTA3NjU1MX0.CNg63s-9VFFun4By4DTShBNWZY8aAofSKI3W8sxkpq8

L'extrémité avant
Site web responsive accessible sur ordinateur et mobile.

Interface épurée, simple et intuitive, inspirée du design Apple avec des couleurs pastels douces.

Page admin avec tableau de bord et page dédiée au code QR affichant le code en grand format avec bouton d'impression et bouton de mise à jour.

Sécurité
Authentification sécurisée avec stockage des mots de passe hashés.

Gestion des sessions et contrôle d'accès au site.

Protection contre les fraudes sur les pointages.

Design et ergonomie
Interface simple et claire, adaptée à une utilisation web.

Affichage du QR code en grand format sur la page admin pour faciliter le scan.

Bouton d'impression évident et fonctionnel pour générer une copie papier du QR code.

Codification ergonomique du scan QR code via la web app avec accès caméra.

Tableau de bord clair avec visualisation des pointages, alertes en cas d'absence.

Livrables attendus
Code source complet avec documentation.

Le backend Rust intègre Supabase.

Frontend web responsive compatible ordinateurs de bureau et mobiles.

Documentation utilisateur et guide d'installation.

Scripts de création des tables Supabase (agents, pointages, QRCode).

Tests unitaires et fonctionnels.

Détails techniques de la base de données (Supabase)
Agents de table : id, nom, email, mot de passe hashé, rôle.

Table pointages : id, agent_id (clé étrangère), date_pointage, heure_pointage, session (matin/après-midi).

Table QRCode : code_unique, date_génération.

Requêtes rapides pour associer un pointage à un agent au moment du scan via le code QR.

