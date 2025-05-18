var express = require('express');
var router = express.Router();
const db = require('../config/db'); 


router.get('/', function(req, res, next) {
  res.render('login', { title: 'Connexion' });
});


router.post('/', async function(req, res, next) {
  const { username, password } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM Utilisateur WHERE NomUtilisateur = ? AND MotDePasse = ?',
      [username, password]
    );

    if (rows.length > 0) {
      // Connexion réussie
      const utilisateur = rows[0];
      // Stocker l'utilisateur en session si elle est utilisée
      res.send(`Bienvenue, ${utilisateur.NomUtilisateur} !`);
    } else {
      res.render('login', {
        title: 'Connexion',
        error: 'Nom d’utilisateur ou mot de passe incorrect.'
      });
    }
  } catch (err) {
    next(err);
  }
});

req.session.userId = user[0].IDUtilisateur;


module.exports = router;
