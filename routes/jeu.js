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

    const [noteRes] = await db.promise().query('SELECT ROUND(AVG(Note),1) AS moyenne FROM Avis WHERE IDJeu = ?', [idJeu]);
    const moyenne = noteRes[0].moyenne || 'Pas encore noté';
    const [avisRes] = await db.promise().query(`
        SELECT a.Note, a.Commentaire, u.NomUtilisateur
        FROM Avis a
        JOIN Utilisateur u ON a.IDUtilisateur = u.IDUtilisateur
        WHERE a.IDJeu = ?
        ORDER BY a.IDAvis DESC
    `, [idJeu]);
    
    res.render('jeu', { jeu, moyenne, userId, avis: avisRes || [] });
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
