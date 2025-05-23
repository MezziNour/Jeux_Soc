const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Fiche du jeu
router.get('/:id', async (req, res) => {
  const idJeu = parseInt(req.params.id);
  const userId = req.session.userId;

  try {
    const [jeuRes] = await db.promise().query('CALL GetJeuDetails(?)', [idJeu]);
    const jeu = jeuRes[0][0];

    const [noteRes] = await db.promise().query('SELECT * FROM VueMoyenneJeux WHERE IDJeu = ?', [idJeu]); //on utilise une vue
    let moyenne = 'Pas encore noté';
    let nbAvis = 0;
    if (noteRes.length > 0) {
      if (noteRes[0].Moyenne !== null) {
        moyenne = noteRes[0].Moyenne;
        nbAvis = noteRes[0].NombreAvis;
      }
    }

    const [avisRes] = await db.promise().query(`
        SELECT a.Note, a.Commentaire, u.NomUtilisateur
        FROM Avis a
        JOIN Utilisateur u ON a.IDUtilisateur = u.IDUtilisateur
        WHERE a.IDJeu = ?
        ORDER BY a.IDAvis DESC
    `, [idJeu]);
    console.log("noteRes:", noteRes[0]);
    
    // Pour savoir combien de personnes ont un certain jeu en wishlist
    const [[wishlistCountRes]] = await db.promise().query('SELECT NbWishlistPourJeu(?) AS total',[idJeu]);
    const nbWishlists = wishlistCountRes?.total || 0;

    res.render('jeu', { jeu, moyenne, nbAvis, userId, nbWishlists,showLogout: false, avis: avisRes || [] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement du jeu');
  }

  

});

// Ajout wishlist
router.post('/wishlist/add', async (req, res) => {
  const { IDJeu } = req.body;
  const userId = req.session.userId;
  await db.promise().query('CALL AddToWishlist(?, ?)', [userId, IDJeu]);
  res.redirect('back');
});

// Ajout playlist
router.post('/playlist/add', async (req, res) => {
  const { IDJeu } = req.body;
  const userId = req.session.userId;
  await db.promise().query('CALL AddToPlaylist(?, ?)', [userId, IDJeu]);
  res.redirect('back');
});

// Récupérer les playlists d’un utilisateur (API appelée par JS)
router.get('/playlist/api/playlists', async (req, res) => {
  const userId = req.session.userId;
  try {
    const [results] = await db.promise().query('SELECT IDPlaylist, NomPlaylist FROM PlaylistNom WHERE IDUtilisateur = ?', [userId]);
    res.json(results);
  } catch (error) {
    console.error('Erreur API playlists :', error);
    res.status(500).send('Erreur serveur');
  }
});

// Ajouter à une playlist existante
router.post('/playlist/add-to-existing', async (req, res) => {
  const { IDJeu, playlistId } = req.body;
  const userId = req.session.userId;
  try {
    await db.promise().query('CALL AddToExistingPlaylist(?, ?, ?)', [userId, playlistId, IDJeu]);
    req.flash('success_msg', 'Jeu ajouté à la playlist avec succès.');
    res.redirect('back');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      req.flash('error_msg', 'Ce jeu est déjà dans la playlist');
      res.redirect('back');
    } else {
      console.error('Erreur ajout à playlist existante :', err);
      req.flash('error_msg', 'Erreur serveur lors de l\'ajout à la playlist.');
      res.redirect('back');
    }
  }
});


// Créer une nouvelle playlist + y ajouter le jeu
router.post('/playlist/create', async (req, res) => {
  const { IDJeu, NomPlaylist } = req.body;
  const userId = req.session.userId;
  try {
    await db.promise().query('CALL CreatePlaylistWithGame(?, ?, ?)', [userId, NomPlaylist, IDJeu]);
    res.redirect('back');
  } catch (err) {
    console.error('Erreur création de playlist :', err);
    res.status(500).send('Erreur serveur');
  }
});


// Ajout à la liste de jeux possédés
router.post('/possede/add', async (req, res) => {
  const { IDJeu } = req.body;
  const userId = req.session.userId;

  if (!userId || !IDJeu) return res.status(400).send('Requête invalide');

  try {
    await db.promise().query('CALL AddJeuPossede(?, ?)', [userId, IDJeu]);
    res.redirect('back');
  } catch (err) {
    console.error('Erreur lors de l’ajout du jeu possédé :', err);
    res.status(500).send('Erreur serveur');
  }
});


// Ajout avis
router.post('/avis/add', async (req, res) => {
  const { IDJeu, note, commentaire } = req.body;
  const userId = req.session.userId;

  await db.promise().query(
    'INSERT INTO Avis (IDJeu, IDUtilisateur, Note, Commentaire) VALUES (?, ?, ?, ?)',
    [IDJeu, userId, note, commentaire]
  );
  res.redirect('back');
});

module.exports = router;
