const db = require('../config/db');
const bcrypt = require('bcrypt');

// Modifier le nom d'utilisateur via procédure stockée
exports.editName = (req, res) => {
  const { newName } = req.body;
  const userId = req.session.userId;

  if (!newName || !userId) return res.status(400).send('Requête invalide');

  db.query('CALL UpdateUsername(?, ?)', [userId, newName], (err) => {
    if (err) return res.status(500).send('Erreur lors de la mise à jour');
    res.redirect('/profile');
  });
};

// Modifier le mot de passe via procédure stockée
exports.editPassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.session.userId;

  if (!newPassword || !userId) return res.status(400).send('Requête invalide');

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.query('CALL UpdatePassword(?, ?)', [userId, hashedPassword], (err) => {
      if (err) return res.status(500).send('Erreur lors de la mise à jour');
      res.redirect('/profile');
    });
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
};

// Supprimer le compte via procédure stockée
exports.deleteAccount = (req, res) => {
  const userId = req.session.userId;

  if (!userId) return res.status(400).send('Requête invalide');

  db.query('CALL DeleteUserAccount(?)', [userId], (err) => {
    if (err) return res.status(500).send('Erreur lors de la suppression');
    req.session.destroy();
    res.redirect('/');
  });
};

// Récupérer les utilisateurs (pas besoin de procédure ici)
exports.getUsersForAdmin = async () => {
  const [users] = await db.promise().query('SELECT * FROM VueUtilisateursAdmin');
  return users;
};

// Promouvoir un utilisateur admin via procédure stockée
exports.makeAdmin = async (userId) => {
  await db.promise().query('CALL MakeAdmin(?)', [userId]);
};

// Retirer les droits admin via procédure stockée
exports.removeAdmin = async (userId) => {
  await db.promise().query('CALL RemoveAdmin(?)', [userId]);
};
