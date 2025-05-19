const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.get('/', function(req, res) {
  if (req.session.userId) {
    return res.redirect('/profile');
  }
  res.render('login', { title: 'Connexion' });
});

router.post('/', async function(req, res, next) {
  const { username, password } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM Utilisateur WHERE NomUtilisateur = ?',
      [username]
    );

    if (rows.length > 0) {
      const utilisateur = rows[0];
      const match = await bcrypt.compare(password, utilisateur.MotDePasse);

      if (match) {
        req.session.userId = utilisateur.IDUtilisateur;
        return res.redirect('/profile');
      }
    }

    res.render('login', {
      title: 'Connexion',
      error: 'Nom d’utilisateur ou mot de passe incorrect.'
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
