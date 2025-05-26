CREATE DATABASE app_jeux_soc;
USE app_jeux_soc;

-- Définition des tables principales
-- Table des utilisateurs et de leur statut (admin ou non)
CREATE TABLE Utilisateur (
   IDUtilisateur INT auto_increment,
   NomUtilisateur VARCHAR(50) NOT NULL,
   MotDePasse VARCHAR(1000) NOT NULL,
   IsAdmin BOOLEAN NOT NULL,
   PRIMARY KEY (IDUtilisateur),
   UNIQUE (NomUtilisateur)
);

-- Table des catégories de genre
CREATE TABLE CategorieGenre (
   IDGenre INT auto_increment,
   NomGenre VARCHAR(50) NOT NULL,
   PRIMARY KEY (IDGenre)
);

-- Table des tranches d’âge minimales requises
CREATE TABLE CategorieAge (
   IDAge INT auto_increment,
   AgeMin INT NOT NULL,
   PRIMARY KEY (IDAge)
);

-- Table des mots-clés pour décrire les jeux
CREATE TABLE MotCle (
   IDMotCle INT auto_increment,
   NomMotCle VARCHAR(50) NOT NULL,
   PRIMARY KEY (IDMotCle)
);

-- Table principale des jeux avec leurs attributs
CREATE TABLE Jeu (
   IDJeu INT,
   NomJeu VARCHAR(50),
   Image VARCHAR (300),
   Descriptions TEXT NOT NULL,
   NbJoueursMax INT NOT NULL,
   NbJoueursMin INT NOT NULL,
   Createur VARCHAR(50) NOT NULL,
   DateSortie DATE NOT NULL,
   DureeMoy TIME NOT NULL,
   IDAge INT NOT NULL,
   PRIMARY KEY (IDJeu),
   UNIQUE (NomJeu),
   FOREIGN KEY (IDAge) REFERENCES CategorieAge(IDAge)
);

-- Table des avis et notes laissés par les utilisateurs
CREATE TABLE Avis (
   IDAvis INT auto_increment,
   Commentaire TEXT,
   Note DECIMAL(15,2),
   IDUtilisateur INT NOT NULL,
   IDJeu INT NOT NULL,
   PRIMARY KEY (IDAvis),
   FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu)
);

-- Table des notifications envoyées aux utilisateurs
CREATE TABLE Notification (
   IDNotification INT auto_increment,
   Message TEXT NOT NULL,
   DateNotification DATE NOT NULL,
   IDJeu INT NOT NULL,
   IDUtilisateur INT NOT NULL,
   PRIMARY KEY (IDNotification),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu),
   FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur)
);

-- Table des jeux possédés par chaque utilisateur
CREATE TABLE JeuxPossedes (
   IDUtilisateur INT,
   IDJeu INT,
   PRIMARY KEY (IDUtilisateur, IDJeu),
   FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu)
);

-- Table de la wishlist des utilisateurs
CREATE TABLE Wishlist (
   IDUtilisateur INT,
   IDJeu INT,
   PRIMARY KEY (IDUtilisateur, IDJeu),
   FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu)
);

-- Liaison Jeu - Genre
CREATE TABLE Appartenir (
   IDJeu INT,
   IDGenre INT,
   PRIMARY KEY (IDJeu, IDGenre),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu),
   FOREIGN KEY (IDGenre) REFERENCES CategorieGenre(IDGenre)
);

-- Table des playlists simples (avant extension nommée)
CREATE TABLE Playlist (
   IDUtilisateur INT,
   IDJeu INT,
   PRIMARY KEY (IDUtilisateur, IDJeu),
   FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu)
);

-- Liaison Jeu - Mot-Clé
CREATE TABLE Associer (
   IDJeu INT,
   IDMotCle INT,
   PRIMARY KEY (IDJeu, IDMotCle),
   FOREIGN KEY (IDJeu) REFERENCES Jeu(IDJeu),
   FOREIGN KEY (IDMotCle) REFERENCES MotCle(IDMotCle)
);

-- Procédures stockées pour la gestion des utilisateurs
SELECT * FROM utilisateur;

-- Met à jour le nom d’un utilisateur
DELIMITER //
CREATE PROCEDURE UpdateUsername(
  IN p_user_id INT,
  IN p_new_name VARCHAR(255)
)
BEGIN
  UPDATE Utilisateur
  SET NomUtilisateur = p_new_name
  WHERE IDUtilisateur = p_user_id;
END;
//
DELIMITER ;

-- Met à jour le mot de passe d’un utilisateur
DELIMITER //
CREATE PROCEDURE UpdatePassword(
  IN p_user_id INT,
  IN p_new_password VARCHAR(255)
)
BEGIN
  UPDATE Utilisateur
  SET MotDePasse = p_new_password
  WHERE IDUtilisateur = p_user_id;
END;
//
DELIMITER ;

-- Supprime un compte utilisateur
DELIMITER //
CREATE PROCEDURE DeleteUserAccount(
  IN p_user_id INT
)
BEGIN
  DELETE FROM Utilisateur
  WHERE IDUtilisateur = p_user_id;
END;
//
DELIMITER ;

-- Passe un utilisateur en administrateur
DELIMITER //
CREATE PROCEDURE MakeAdmin(
  IN p_user_id INT
)
BEGIN
  UPDATE Utilisateur
  SET IsAdmin = TRUE
  WHERE IDUtilisateur = p_user_id;
END;
//
DELIMITER ;

-- Retire le statut administrateur
DELIMITER //
CREATE PROCEDURE RemoveAdmin(
  IN p_user_id INT
)
BEGIN
  UPDATE Utilisateur
  SET IsAdmin = FALSE
  WHERE IDUtilisateur = p_user_id;
END;
//
DELIMITER ;

-- Vues pour simplifier les requêtes fréquentes

-- Profil utilisateur avec nombre de jeux possédés
CREATE OR REPLACE VIEW VueProfilUtilisateur AS
SELECT 
  u.IDUtilisateur,
  u.NomUtilisateur,
  u.IsAdmin,
  COUNT(jp.IDJeu) AS NombreJeux
FROM Utilisateur u
LEFT JOIN JeuxPossedes jp ON u.IDUtilisateur = jp.IDUtilisateur
GROUP BY u.IDUtilisateur;

-- Liste des utilisateurs et leur statut admin
CREATE OR REPLACE VIEW VueUtilisateursAdmin AS
SELECT 
  IDUtilisateur,
  NomUtilisateur,
  IsAdmin
FROM Utilisateur;

-- Détails des jeux possédés
CREATE OR REPLACE VIEW VueJeuxPossedes AS
SELECT 
  jp.IDUtilisateur,
  j.IDJeu,
  j.NomJeu,
  j.Image,
  j.Descriptions,
  j.NbJoueursMin,
  j.NbJoueursMax,
  j.Createur,
  j.DateSortie,
  j.DureeMoy
FROM JeuxPossedes jp
JOIN Jeu j ON jp.IDJeu = j.IDJeu;

-- Détails de la wishlist
CREATE OR REPLACE VIEW VueWishlist AS
SELECT 
  w.IDUtilisateur,
  j.IDJeu,
  j.NomJeu,
  j.Image,
  j.Descriptions,
  j.NbJoueursMin,
  j.NbJoueursMax,
  j.Createur,
  j.DateSortie,
  j.DureeMoy
FROM Wishlist w
JOIN Jeu j ON w.IDJeu = j.IDJeu;

-- Détails des playlists
CREATE OR REPLACE VIEW VuePlaylist AS
SELECT 
  p.IDUtilisateur,
  j.IDJeu,
  j.NomJeu,
  j.Image,
  j.Descriptions,
  j.NbJoueursMin,
  j.NbJoueursMax,
  j.Createur,
  j.DateSortie,
  j.DureeMoy
FROM Playlist p
JOIN Jeu j ON p.IDJeu = j.IDJeu;


-- Procédure pour obtenir les détails complets d’un jeu
DELIMITER //

CREATE PROCEDURE GetJeuDetails(IN idJeu INT)
BEGIN
  SELECT 
    j.IDJeu,
    j.NomJeu,
    j.Descriptions,
    j.Createur,
    j.DateSortie,
    j.DureeMoy,
    j.Image,
    j.NbJoueursMin,
    j.NbJoueursMax,
    ca.AgeMin,
    GROUP_CONCAT(DISTINCT mc.NomMotCle SEPARATOR ', ') AS MotsCles,
    GROUP_CONCAT(DISTINCT cg.NomGenre SEPARATOR ', ') AS Genres
  FROM Jeu j
  JOIN CategorieAge ca ON j.IDAge = ca.IDAge
  LEFT JOIN Associer a ON j.IDJeu = a.IDJeu
  LEFT JOIN MotCle mc ON mc.IDMotCle = a.IDMotCle
  LEFT JOIN Appartenir ap ON j.IDJeu = ap.IDJeu
  LEFT JOIN CategorieGenre cg ON cg.IDGenre = ap.IDGenre
  WHERE j.IDJeu = idJeu
  GROUP BY j.IDJeu;
  
END//

DELIMITER ;

-- Procédures d’ajout simplifié (playlist et wishlist)
DELIMITER //

CREATE PROCEDURE AddToPlaylist(IN userId INT, IN jeuId INT)
BEGIN
  INSERT IGNORE INTO Playlist (IDUtilisateur, IDJeu)
  VALUES (userId, jeuId);
END//

DELIMITER ;

DELIMITER //

CREATE PROCEDURE AddToWishlist(IN userId INT, IN jeuId INT)
BEGIN
  INSERT IGNORE INTO Wishlist (IDUtilisateur, IDJeu)
  VALUES (userId, jeuId);
END//

DELIMITER ;

-- Vue pour la moyenne et le nombre d’avis par jeu
CREATE OR REPLACE VIEW VueMoyenneJeux AS
SELECT 
  IDJeu,
  ROUND(AVG(Note), 1) AS Moyenne,
  COUNT(*) AS NombreAvis
FROM Avis
GROUP BY IDJeu;

-- Exécution d’une requête de test sur les avis
SELECT * 
FROM Avis a
JOIN Utilisateur u ON a.IDUtilisateur = u.IDUtilisateur
WHERE IDJeu = 432;

-- Gestion des jeux possédés avec procédures et triggers
DELIMITER //
CREATE PROCEDURE AddJeuPossede(IN p_userId INT, IN p_jeuId INT)
BEGIN
  -- Vérifie si l’association existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM JeuxPossedes WHERE IDUtilisateur = p_userId AND IDJeu = p_jeuId
  ) THEN
    INSERT INTO JeuxPossedes (IDUtilisateur, IDJeu) VALUES (p_userId, p_jeuId);
  END IF;
END //
DELIMITER ;

-- Trigger après insertion pour mettre à jour le compteur de jeux
DELIMITER //
CREATE TRIGGER after_insert_jeux_possedes
AFTER INSERT ON JeuxPossedes
FOR EACH ROW
BEGIN
  UPDATE Utilisateur
  SET NombreJeux = (
    SELECT COUNT(*) FROM JeuxPossedes WHERE IDUtilisateur = NEW.IDUtilisateur
  )
  WHERE IDUtilisateur = NEW.IDUtilisateur;
END;
//
DELIMITER ;

-- Trigger après suppression pour ajuster le compteur
DELIMITER //
CREATE TRIGGER after_delete_jeux_possedes
AFTER DELETE ON JeuxPossedes
FOR EACH ROW
BEGIN
  UPDATE Utilisateur
  SET NombreJeux = (
    SELECT COUNT(*) FROM JeuxPossedes WHERE IDUtilisateur = OLD.IDUtilisateur
  )
  WHERE IDUtilisateur = OLD.IDUtilisateur;
END;
//
DELIMITER ;

-- Ajout d’un champ pour stocker le nombre de jeux possédés
ALTER TABLE Utilisateur ADD NombreJeux INT DEFAULT 0;

-- Créer une nouvelle playlist avec un jeu
DELIMITER //
CREATE PROCEDURE CreatePlaylistWithGame(IN uid INT, IN nom VARCHAR(100), IN jeuId INT)
BEGIN
  DECLARE newPlaylistId INT;
  INSERT INTO PlaylistNom (IDUtilisateur, NomPlaylist) VALUES (uid, nom);
  SET newPlaylistId = LAST_INSERT_ID();
  INSERT INTO Playlist (IDUtilisateur, IDPlaylist, IDJeu) VALUES (uid, newPlaylistId, jeuId);
END;
//
DELIMITER ;

-- Ajouter à une playlist existante
DELIMITER //
CREATE PROCEDURE AddToExistingPlaylist(IN uid INT, IN playlistId INT, IN jeuId INT)
BEGIN
  INSERT INTO Playlist (IDUtilisateur, IDPlaylist, IDJeu) VALUES (uid, playlistId, jeuId);
END;
//
DELIMITER ;

-- Extension des playlists pour gérer des noms

-- Création de la table des noms de playlist
CREATE TABLE PlaylistNom (
  IDPlaylist INT AUTO_INCREMENT PRIMARY KEY,
  IDUtilisateur INT,
  NomPlaylist VARCHAR(100),
  FOREIGN KEY (IDUtilisateur) REFERENCES Utilisateur(IDUtilisateur)
);

-- Ajout d’une colonne d’identifiant de playlist au lien principal
ALTER TABLE Playlist ADD COLUMN IDPlaylist INT NOT NULL;

-- Vue des playlists sans le détail des jeux
CREATE OR REPLACE VIEW VuePlaylists AS
SELECT 
  p.IDPlaylist,
  p.IDUtilisateur,
  pl.NomPlaylist
FROM Playlist p
JOIN PlaylistNom pl ON p.IDPlaylist = pl.IDPlaylist;

-- Vue des playlists avec leurs jeux
CREATE OR REPLACE VIEW VuePlaylistsAvecJeux AS
SELECT 
  p.IDUtilisateur,
  p.IDPlaylist,
  pl.NomPlaylist,
  j.IDJeu,
  j.NomJeu,
  j.Image
FROM Playlist p
JOIN PlaylistNom pl ON p.IDPlaylist = pl.IDPlaylist
JOIN Jeu j ON p.IDJeu = j.IDJeu;

-- Fonctionnalité de troc entre utilisateurs

-- Table des propositions de troc
CREATE TABLE Troc (
  IDTroc INT AUTO_INCREMENT PRIMARY KEY,
  IDDemandeur INT NOT NULL,
  IDReceveur INT NOT NULL,
  JeuPropose INT NOT NULL,
  JeuSouhaite INT NOT NULL,
  Etat ENUM('En attente', 'Accepté', 'Refusé') DEFAULT 'En attente',
  DateDemande DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (IDDemandeur) REFERENCES Utilisateur(IDUtilisateur),
  FOREIGN KEY (IDReceveur) REFERENCES Utilisateur(IDUtilisateur),
  FOREIGN KEY (JeuPropose) REFERENCES Jeu(IDJeu),
  FOREIGN KEY (JeuSouhaite) REFERENCES Jeu(IDJeu)
);

-- Vue des opportunités de troc selon possessions et souhaits
CREATE VIEW OpportunitesTroc AS
SELECT 
  jp1.IDUtilisateur AS IDDemandeur,
  w.IDUtilisateur AS IDReceveur,
  jp1.IDJeu AS JeuPropose,
  w.IDJeu AS JeuSouhaite
FROM JeuxPossedes jp1
JOIN Wishlist w ON jp1.IDJeu = w.IDJeu
JOIN JeuxPossedes jp2 ON jp2.IDUtilisateur = w.IDUtilisateur
WHERE jp1.IDUtilisateur != w.IDUtilisateur;

-- Procédure pour proposer un troc et notifier le destinataire
DELIMITER //

CREATE PROCEDURE ProposerTroc(
  IN demandeur INT,
  IN receveur INT,
  IN jeuPropose INT,
  IN jeuSouhaite INT
)
BEGIN
  INSERT INTO Troc (IDDemandeur, IDReceveur, JeuPropose, JeuSouhaite)
  VALUES (demandeur, receveur, jeuPropose, jeuSouhaite);

  INSERT INTO Notification (Message, DateNotification, IDJeu, IDUtilisateur)
  VALUES (
    CONCAT('Nouvelle proposition de troc : échanger "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = jeuSouhaite), 
           '" contre "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = jeuPropose), '"'),
    CURDATE(),
    jeuSouhaite,
    receveur
  );
END //

DELIMITER ;

-- Procédure pour accepter un troc et mettre à jour les possessions
DELIMITER //

CREATE PROCEDURE AccepterTroc(IN trocId INT)
BEGIN
  DECLARE j1 INT;
  DECLARE j2 INT;
  DECLARE u1 INT;
  DECLARE u2 INT;

  -- Récupérer les données
  SELECT JeuPropose, JeuSouhaite, IDDemandeur, IDReceveur 
  INTO j1, j2, u1, u2
  FROM Troc WHERE IDTroc = trocId;

  -- Echange des jeux entre les deux utilisateurs
  DELETE FROM JeuxPossedes WHERE IDUtilisateur = u1 AND IDJeu = j1;
  DELETE FROM JeuxPossedes WHERE IDUtilisateur = u2 AND IDJeu = j2;

  INSERT INTO JeuxPossedes (IDUtilisateur, IDJeu) VALUES (u1, j2);
  INSERT INTO JeuxPossedes (IDUtilisateur, IDJeu) VALUES (u2, j1);

  -- Mise à jour de l’état du troc
  UPDATE Troc SET Etat = 'Accepté' WHERE IDTroc = trocId;

  -- Notifications de confirmation pour chaque partie
  INSERT INTO Notification (Message, DateNotification, IDJeu, IDUtilisateur)
  VALUES (
    CONCAT('Troc accepté : vous avez échangé votre jeu "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = j1),
           '" contre "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = j2), '"'),
    CURDATE(),
    j2,
    u1
  );

  INSERT INTO Notification (Message, DateNotification, IDJeu, IDUtilisateur)
  VALUES (
    CONCAT('Troc accepté : vous avez échangé votre jeu "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = j2),
           '" contre "', 
           (SELECT NomJeu FROM Jeu WHERE IDJeu = j1), '"'),
    CURDATE(),
    j1,
    u2
  );
END //

DELIMITER ;

-- Index pour éviter les doublons de propositions
CREATE UNIQUE INDEX idx_unique_troc 
ON Troc(IDDemandeur, IDReceveur, JeuPropose, JeuSouhaite);

-- Ajout de colonnes pour enrichir les notifications de troc
ALTER TABLE Notification
ADD COLUMN TypeNotif ENUM('troc_demande', 'troc_reponse', 'autre') DEFAULT 'autre',
ADD COLUMN IDJeuOffert INT NULL,
ADD COLUMN IDDemandeur INT NULL,
ADD COLUMN Etat ENUM('en_attente', 'accepté', 'refusé') DEFAULT 'en_attente',
ADD FOREIGN KEY (IDJeuOffert) REFERENCES Jeu(IDJeu);

CREATE OR REPLACE VIEW VueTrocJeux AS
SELECT
  w.IDUtilisateur AS IDUtilisateurDemandeur,     -- Celui qui VEUT le jeu
  p.IDUtilisateur AS IDUtilisateurPossesseur,    -- Celui qui POSSEDE le jeu
  w.IDJeu AS IDJeuSouhaite,
  j.NomJeu AS TitreJeuSouhaite,
  u1.NomUtilisateur AS NomDemandeur,
  u2.NomUtilisateur AS NomPossesseur
FROM Wishlist w
JOIN JeuxPossedes p ON w.IDJeu = p.IDJeu
JOIN Utilisateur u1 ON w.IDUtilisateur = u1.IDUtilisateur
JOIN Utilisateur u2 ON p.IDUtilisateur = u2.IDUtilisateur
JOIN Jeu j ON j.IDJeu = w.IDJeu
WHERE w.IDUtilisateur != p.IDUtilisateur;

SELECT 
  CONCAT('ALTER TABLE `Jeu` DROP INDEX `', INDEX_NAME, '`;') AS drop_stmt
FROM information_schema.STATISTICS
WHERE 
  TABLE_SCHEMA = 'app_jeux_soc'
  AND TABLE_NAME   = 'Jeu'
  AND INDEX_NAME IN (
    'idx_fulltext_nom',
    'idx_age',
    'idx_nb_jmin',
    'idx_nb_jmax'
  );
  
ALTER TABLE `Jeu`
  ADD FULLTEXT INDEX `idx_fulltext_nom` (`NomJeu`),
  ADD INDEX            `idx_age`         (`IDAge`),
  ADD INDEX            `idx_nb_jmin`     (`NbJoueursMin`),
  ADD INDEX            `idx_nb_jmax`     (`NbJoueursMax`);

-- Vue dédiée pour la recherche multi-critères
CREATE OR REPLACE VIEW `VueJeuRecherche` AS
SELECT
  j.IDJeu,
  j.NomJeu,
  j.Image,
  j.NbJoueursMin,
  j.NbJoueursMax,
  j.IDAge,
  a.IDGenre
FROM `Jeu` j
LEFT JOIN `Appartenir` a ON j.IDJeu = a.IDJeu;

-- Procédure de recherche de jeux avec filtres
DELIMITER //
CREATE PROCEDURE `SearchGames`(
  IN p_keywords VARCHAR(100),
  IN p_genres    VARCHAR(255),
  IN p_ages      VARCHAR(255),
  IN p_minP      INT,
  IN p_maxP      INT
)
BEGIN
  SELECT DISTINCT
    vr.IDJeu,
    vr.NomJeu,
    vr.Image
  FROM `VueJeuRecherche` vr
  JOIN `Jeu` j ON j.IDJeu = vr.IDJeu
  WHERE
    (p_keywords IS NULL OR p_keywords = ''
      OR j.NomJeu LIKE CONCAT('%', p_keywords, '%'))
    AND (p_genres IS NULL OR p_genres = ''
      OR FIND_IN_SET(vr.IDGenre, p_genres))
    AND (p_ages IS NULL OR p_ages = ''
      OR FIND_IN_SET(j.IDAge, p_ages))
    AND (p_minP IS NULL OR j.NbJoueursMin >= p_minP)
    AND (p_maxP IS NULL OR j.NbJoueursMax <= p_maxP)
  ORDER BY j.NomJeu
  LIMIT 100;
END;
//
DELIMITER ; 

-- Vue des jeux les plus récents
CREATE VIEW VueTopRecents AS
SELECT
j.IDJeu,
j.NomJeu,
j.Image,
j.DateSortie
FROM Jeu j
ORDER BY j.DateSortie DESC
LIMIT 10;


SELECT * FROM Avis WHERE IDJeu =432;

CREATE OR REPLACE VIEW VueMoyenneJeux AS
SELECT 
  IDJeu,
  ROUND(AVG(Note), 1) AS Moyenne,
  COUNT(*) AS NombreAvis
FROM Avis
WHERE Note IS NOT NULL
GROUP BY IDJeu;


-- Récupère le jeu préféré d’un utilisateur selon ses avis
DELIMITER //
CREATE FUNCTION JeuPrefere(id INT)
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN (
    SELECT a.IDJeu
    FROM Avis a
    JOIN Jeu j ON j.IDJeu = a.IDJeu
    WHERE a.IDUtilisateur = id
    ORDER BY a.Note DESC, j.DateSortie DESC
    LIMIT 1
  );
END;
//
DELIMITER ;


-- Attribue un titre à un utilisateur selon son activité
DELIMITER //
CREATE FUNCTION TitreUtilisateur(id INT)
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  DECLARE nbAvis INT;
  DECLARE nbJeux INT;
  DECLARE titre VARCHAR(50);

  SET nbAvis = (SELECT COUNT(*) FROM Avis WHERE IDUtilisateur = id);
  SET nbJeux = (SELECT COUNT(*) FROM JeuxPossedes WHERE IDUtilisateur = id);

  IF nbJeux >= 10 THEN
    SET titre = 'Collectionneur';
  ELSEIF nbAvis >= 10 THEN
    SET titre = 'Critique professionnel';
  ELSEIF nbAvis = 0 AND nbJeux = 0 THEN
    SET titre = 'Touriste';
  ELSE
    SET titre = 'Explorateur';
  END IF;

  RETURN titre;
END;
//
DELIMITER ;

-- Compte combien d’utilisateurs ont mis un jeu en wishlist
DELIMITER //
CREATE FUNCTION NbWishlistPourJeu(p_IDJeu INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE total INT;
  SELECT COUNT(*) INTO total
  FROM Wishlist
  WHERE IDJeu = p_IDJeu;
  RETURN total;
END;
//
DELIMITER ;


-- Transactions sécurisées pour la wishlist
delimiter //
START TRANSACTION;
SELECT 1 FROM Utilisateur WHERE IDUtilisateur = ?;
SELECT 1 FROM Jeu WHERE IDJeu = ?;
INSERT INTO Wishlist (IDUtilisateur, IDJeu)
SELECT ?, ?
WHERE NOT EXISTS (
    SELECT 1 FROM Wishlist WHERE IDUtilisateur = ? AND IDJeu = ?
);
COMMIT;
//


-- Suppression sécrisée dans la Wishlist
START TRANSACTION;
DELETE FROM Wishlist
WHERE IDUtilisateur = ? AND IDJeu = ?;
COMMIT;
//

delimiter ;