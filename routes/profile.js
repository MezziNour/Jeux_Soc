const express = require('express');
const router = express.Router();
const db = require('../config/db');
const profileController = require('../controllers/profileController');

// Middleware pour vérifier si l'utilisateur est connecté
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Middleware pour vérifier si l'utilisateur est administrateur
async function isAdmin(req, res, next) {
  try {
    const [user] = await db.promise().query(
      'SELECT IsAdmin FROM Utilisateur WHERE IDUtilisateur = ?', 
      [req.session.userId]
    );
    if (user.length > 0 && user[0].IsAdmin) {
      next();
    } else {
      res.status(403).send('Accès refusé');
    }
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
}

// Toutes les routes ici nécessitent une authentification
router.use(isAuthenticated);

// Page profil
router.get('/', async (req, res) => {
  const userId = req.session.userId;

  try {
    // Infos utilisateur
    const [[user]] = await db.promise().query(
      'SELECT * FROM VueProfilUtilisateur WHERE IDUtilisateur = ?', 
      [userId]
    );

    // Jeux possédés et wishlist
    const [jeux] = await db.promise().query('SELECT * FROM VueJeuxPossedes WHERE IDUtilisateur = ?', [userId]);
    const [wishlist] = await db.promise().query('SELECT * FROM VueWishlist WHERE IDUtilisateur = ?', [userId]);

    // Playlists avec tous les jeux déjà joints
    const [rows] = await db.promise().query(
      'SELECT * FROM VuePlaylistsAvecJeux WHERE IDUtilisateur = ?', 
      [userId]
    );
    console.log(rows);

    // Regrouper par playlist côté Node.js
    const playlistsMap = new Map();

    for (const row of rows) {
      const id = row.IDPlaylist;
      if (!playlistsMap.has(id)) {
        playlistsMap.set(id, {
          IDPlaylist: id,
          NomPlaylist: row.NomPlaylist,
          jeux: []
        });
      }
      playlistsMap.get(id).jeux.push({
        IDJeu: row.IDJeu,
        NomJeu: row.NomJeu,
        Image: row.Image
      });

      
    

    }

    const playlists = Array.from(playlistsMap.values());


    // Propositions de troc
    const [trocs] = await db.promise().query(
      'SELECT * FROM VueTrocJeux WHERE IDUtilisateurPossesseur = ?', 
      [userId]
    );

    for (const troc of trocs) {
      const [jeuxDemandeur] = await db.promise().query(
        'SELECT j.IDJeu, j.NomJeu FROM JeuxPossedes jp JOIN Jeu j ON jp.IDJeu = j.IDJeu WHERE jp.IDUtilisateur = ?',
        [troc.IDUtilisateurDemandeur]
      );
      troc.jeuxDemandeur = jeuxDemandeur; // ajouter la liste des jeux du demandeur à chaque proposition
    }
    

    // Charger notifications de troc en attente pour l'utilisateur connecté (type 'troc_reponse' et état 'en_attente')
    const [notificationsTroc] = await db.promise().query(
      `SELECT * FROM Notification 
      WHERE IDUtilisateur = ? AND TypeNotif = 'troc_reponse' AND Etat = 'en_attente'`,
      [userId]
    );
    console.log('Notification récupérée :', notificationsTroc);


    // Liste utilisateurs pour admins
    let utilisateurs = [];
    if (user.IsAdmin) {
      utilisateurs = await profileController.getUsersForAdmin();
    }

    res.render('profile', {
      user,
      nbJeux: user.NombreJeux,
      wishlist,
      jeux,
      playlists,
      utilisateurs,
      trocs,
      notificationsTroc
    });

  } catch (error) {
    console.error('Erreur dans /profile :', error);
    res.status(500).send('Erreur serveur');
  }
});


// Routes de modification (nom, mot de passe, suppression)
router.post('/edit-name', profileController.editName);
router.post('/edit-password', profileController.editPassword);
router.post('/delete', profileController.deleteAccount);

// Supprimer un jeu de la wishlist
router.post('/wishlist/delete', async (req, res) => {
  const { IDJeu } = req.body;
  const userId = req.session.userId;

  try {
    await db.promise().query(
      'DELETE FROM Wishlist WHERE IDUtilisateur = ? AND IDJeu = ?',
      [userId, IDJeu]
    );
    res.redirect('/profile');
  } catch (error) {
    console.error('Erreur lors de la suppression de la wishlist :', error);
    res.status(500).send('Erreur serveur');
  }
});

// Supprimer un jeu possédé
router.post('/jeux/delete', async (req, res) => {
  const { IDJeu } = req.body;
  const userId = req.session.userId;

  try {
    await db.promise().query(
      'DELETE FROM JeuxPossedes WHERE IDUtilisateur = ? AND IDJeu = ?',
      [userId, IDJeu]
    );
    res.redirect('/profile');
  } catch (error) {
    console.error('Erreur lors de la suppression du jeu possédé :', error);
    res.status(500).send('Erreur serveur');
  }
});

// Supprimer un jeu d'une playlist
router.post('/playlist/delete', async (req, res) => {
  const { IDJeu, IDPlaylist } = req.body;  // Ajouter IDPlaylist dans le formulaire
  const userId = req.session.userId;

  try {
    await db.promise().query(
      'DELETE FROM Playlist WHERE IDUtilisateur = ? AND IDJeu = ? AND IDPlaylist = ?',
      [userId, IDJeu, IDPlaylist]
    );
    res.redirect('/profile');
  } catch (error) {
    console.error('Erreur lors de la suppression de la playlist :', error);
    res.status(500).send('Erreur serveur');
  }
});

router.post('/troc/choisir', async (req, res) => {
  console.log('REQ.BODY', req.body);
  console.log('SESSION userId', req.session.userId);

  const { IDJeuSouhaité, IDUtilisateurDemandeur, IDJeuOffert } = req.body;
  const IDUtilisateurPossesseur = req.session.userId;

  try {
    // Vérifie que le demandeur possède bien le jeu souhaité
    const [[verifJeuSouhaite]] = await db.promise().query(
      'SELECT 1 FROM Wishlist WHERE IDUtilisateur = ? AND IDJeu = ?',
      [IDUtilisateurDemandeur, IDJeuSouhaité]
    );

    // Vérifie que le demandeur possède bien le jeu offert
    const [[verifJeuOffert]] = await db.promise().query(
      'SELECT 1 FROM JeuxPossedes WHERE IDUtilisateur = ? AND IDJeu = ?',
      [IDUtilisateurDemandeur, IDJeuOffert]
    );

    if (!verifJeuSouhaite || !verifJeuOffert) {
      return res.status(400).send("Troc invalide : l’un des jeux ne correspond pas à son propriétaire.");
    }

    // Récupère les noms des jeux
    const [[jeuSouhaite]] = await db.promise().query(
      'SELECT NomJeu FROM Jeu WHERE IDJeu = ?',
      [IDJeuSouhaité]
    );

    const [[jeuOffert]] = await db.promise().query(
      'SELECT NomJeu FROM Jeu WHERE IDJeu = ?',
      [IDJeuOffert]
    );

    const nomJeuSouhaite = jeuSouhaite?.NomJeu || 'un jeu';
    const nomJeuOffert = jeuOffert?.NomJeu || 'un de vos jeux';

    // Message plus clair pour le demandeur
    const message = `Proposition d'échange : vous recevez "${nomJeuOffert}" contre votre jeu "${nomJeuSouhaite}".`;

    // Insère la notification pour le demandeur
    await db.promise().query(
      `INSERT INTO Notification 
        (Message, DateNotification, IDUtilisateur, IDJeu, TypeNotif, Etat, IDDemandeur, IDJeuOffert)
       VALUES (?, CURDATE(), ?, ?, 'troc_reponse', 'en_attente', ?, ?)`,
      [message, IDUtilisateurDemandeur, IDJeuSouhaité, IDUtilisateurPossesseur, IDJeuOffert]
    );

    res.redirect('/profile');
  } catch (error) {
    console.error('Erreur lors de la proposition de troc :', error);
    res.status(500).send("Erreur lors de la proposition de troc.");
  }
});




router.post('/troc/reponse', async (req, res) => {
  const { IDNotification, reponse } = req.body;
  const IDUtilisateurPossesseur = req.session.userId;

  try {
    const [[notification]] = await db.promise().query(
      'SELECT * FROM Notification WHERE IDNotification = ? AND IDUtilisateur = ?',
      [IDNotification, IDUtilisateurPossesseur]
    );

    if (!notification || notification.TypeNotif !== 'troc_reponse' || notification.Etat !== 'en_attente') {
      return res.status(400).send('Notification invalide ou déjà traitée.');
    }

    if (reponse === 'accepté') {
      const idDemandeur = notification.IDDemandeur;
      const idAccepteur = IDUtilisateurPossesseur;
      const jeuDemandeur = notification.IDJeu;
      const jeuAccepteur = notification.IDJeuOffert;

      if (!idDemandeur || !jeuDemandeur || !jeuAccepteur) {
        return res.status(400).send('Données manquantes dans la notification.');
      }

      try {
        await db.promise().beginTransaction();

        await db.promise().query(
          'DELETE FROM JeuxPossedes WHERE IDUtilisateur = ? AND IDJeu = ?',
          [idAccepteur, jeuAccepteur]
        );

        await db.promise().query(
          'DELETE FROM JeuxPossedes WHERE IDUtilisateur = ? AND IDJeu = ?',
          [idDemandeur, jeuDemandeur]
        );

        await db.promise().query(
          'INSERT INTO JeuxPossedes (IDUtilisateur, IDJeu) VALUES (?, ?)',
          [idDemandeur, jeuAccepteur]
        );

        await db.promise().query(
          'INSERT INTO JeuxPossedes (IDUtilisateur, IDJeu) VALUES (?, ?)',
          [idAccepteur, jeuDemandeur]
        );

        await db.promise().query(
          'UPDATE Notification SET Etat = "accepté" WHERE IDNotification = ?',
          [IDNotification]
        );

        await db.promise().commit();

        await db.promise().query(
          'INSERT INTO Notification (Message, DateNotification, IDJeu, IDUtilisateur, TypeNotif, Etat, IDDemandeur, IDJeuOffert) VALUES (?, CURDATE(), ?, ?, "autre", "accepté", NULL, NULL)',
          [`Le troc a été accepté !`, jeuDemandeur, idDemandeur]
        );

      } catch (error) {
        await db.promise().rollback();
        console.error('Erreur pendant transaction troc accepté :', error);
        return res.status(500).send('Erreur lors du traitement du troc.');
      }

    } else {
      await db.promise().query(
        'UPDATE Notification SET Etat = "refusé" WHERE IDNotification = ?',
        [IDNotification]
      );
    }

    res.redirect('/profile');

  } catch (error) {
    console.error('Erreur lors de la réponse au troc :', error);
    res.status(500).send('Erreur serveur');
  }
});




// Routes admin pour gérer droits utilisateurs
router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await profileController.getUsersForAdmin();
    res.render('admin_users', { users });
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
});

router.post('/admin/make-admin', isAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    await profileController.makeAdmin(userId);
    res.redirect('/profile');
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
});

router.post('/admin/remove-admin', isAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    await profileController.removeAdmin(userId);
    res.redirect('/profile');
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
