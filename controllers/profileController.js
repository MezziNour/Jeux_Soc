const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.editName = (req, res) => {
  const { newName } = req.body;
  const userId = req.session.userId;

  if (!newName || !userId) return res.status(400).send('Requête invalide');

  db.query('UPDATE Utilisateur SET NomUtilisateur = ? WHERE IDUtilisateur = ?', [newName, userId], (err) => {
    if (err) return res.status(500).send('Erreur lors de la mise à jour');
    res.redirect('/profile');
  });
};

exports.editPassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.session.userId;

  if (!newPassword || !userId) return res.status(400).send('Requête invalide');

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE Utilisateur SET MotDePasse = ? WHERE IDUtilisateur = ?', [hashedPassword, userId], (err) => {
      if (err) return res.status(500).send('Erreur lors de la mise à jour');
      res.redirect('/profile');
    });
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
};

exports.deleteAccount = (req, res) => {
  const userId = req.session.userId;

  if (!userId) return res.status(400).send('Requête invalide');

  db.query('DELETE FROM Utilisateur WHERE IDUtilisateur = ?', [userId], (err) => {
    if (err) return res.status(500).send('Erreur lors de la suppression');
    req.session.destroy();
    res.redirect('/');
  });
};

exports.getUsersForAdmin = async () => {
  const [users] = await db.promise().query('SELECT IDUtilisateur, NomUtilisateur, IsAdmin FROM Utilisateur');
  return users;
};

exports.makeAdmin = async (userId) => {
  await db.promise().query('UPDATE Utilisateur SET IsAdmin = TRUE WHERE IDUtilisateur = ?', [userId]);
};

exports.removeAdmin = async (userId) => {
  await db.promise().query('UPDATE Utilisateur SET IsAdmin = FALSE WHERE IDUtilisateur = ?', [userId]);
};
