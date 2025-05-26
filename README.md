# JeuSoc - Application de gestion et d’échange de jeux de société

JeuSoc est un site web (Node.js + MySQL) qui permet aux utilisateurs de :
- Consulter un catalogue de jeux de société
- Rechercher et filtrer par mots-clés, genres, âge et nombre de joueurs
- Ajouter des jeux à leur wishlist et à leur collection (jeux possédés)
- Créer et gérer des playlists de jeux
- Laisser des avis (note et commentaire)
- Proposer et accepter des trocs entre utilisateurs
- Gérer leur profil (nom, mot de passe)
- Pour les admins : promouvoir/démouvoir des utilisateurs

# Prérequis

- Node.js 
- npm
- MySQL

# Installation

1. Cloner le dépôt :
-     git clone https://github.com/MezziNour/Jeux_Soc.git

3. Installer les dépendances :
-     npm install

3.Configurer la base de données
- Ouvrez config/db.js et ajouter lemot de passe de votre base de données.
- Créez la base de données et les tables en important le script SQL :
-   Via le terminal :
-     mysql -u root -p app_jeux_soc < Jeux_Soc/db/app_jeux_soc.sql
-   Ou via un outil MySQL :
-     1. Ouvrir le fichier db/app_jeux_soc.sql
-     2. Exécuter

# Lancement de l’application
-     npm start
L’application écoute par défaut sur le port 3000. Ouvrez votre navigateur à : http://localhost:3000

# Fonctionnalités clés
- Recherche dynamique via /api/games et procédure stockée SearchGames
- Gestion complète du profil avec procédures stockées (update, delete, admin)
- Playlists personnalisées (création, ajout, suppression)
- Système de troc avec notifications et transactions sécurisées
