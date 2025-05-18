const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');


router.get('/', (req, res) => {
  res.render('register', { title: 'Créer un compte' });
});


router.post('/', async (req, res) => {
  const { username, password, confirm_password } = req.body;

  if (!username || !password || !confirm_password) {
    return res.status(400).send('Tous les champs sont requis.');
  }

  if (password !== confirm_password) {
    return res.status(400).send('Les mots de passe ne correspondent pas.');
  }

  try {
    // Vérifie si l'utilisateur existe
    const [users] = await db.promise().query(
      'SELECT * FROM Utilisateur WHERE NomUtilisateur = ?',
      [username]
    );
    if (users.length > 0) {
      return res.status(400).send('Nom d’utilisateur déjà pris.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      'INSERT INTO Utilisateur (NomUtilisateur, MotDePasse, IsAdmin) VALUES (?, ?, ?)',
      [username, hashedPassword, false]
    );

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur.');
  }
});

module.exports = router;
