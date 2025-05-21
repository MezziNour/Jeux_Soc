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
      utilisateurs
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
