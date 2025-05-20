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

    const [[user]] = await db.promise().query(
      'SELECT * FROM VueProfilUtilisateur WHERE IDUtilisateur = ?', 
      [userId]
    );
    

    const [jeux] = await db.promise().query('SELECT * FROM VueJeuxPossedes WHERE IDUtilisateur = ?', [userId]);
    const [wishlist] = await db.promise().query('SELECT * FROM VueWishlist WHERE IDUtilisateur = ?', [userId]);
    const [playlists] = await db.promise().query('SELECT * FROM VuePlaylist WHERE IDUtilisateur = ?', [userId]);


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

// Routes accessibles uniquement aux admins pour gérer les droits utilisateurs
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

