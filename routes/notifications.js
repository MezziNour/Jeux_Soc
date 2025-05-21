const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware d'authentification
router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
});

// Affichage des notifications
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  try {
    const [notifications] = await db.promise().query(
      'SELECT * FROM Notification WHERE IDUtilisateur = ?', 
      [userId]
    );
    res.render('notifications', { notifications });
  } catch (error) {
    console.error('Erreur récupération notifications :', error);
    res.status(500).send('Erreur serveur');
  }
});

// Accepter le troc
router.post('/accept', async (req, res) => {
  const { notificationId } = req.body;

  try {
    await db.promise().query(
      `UPDATE Notification SET Statut = 'accepté' WHERE IDNotification = ?`,
      [notificationId]
    );
    res.redirect('/notifications');
  } catch (error) {
    console.error('Erreur acceptation troc :', error);
    res.status(500).send('Erreur serveur');
  }
});

// Refuser le troc
router.post('/reject', async (req, res) => {
  const { notificationId } = req.body;

  try {
    await db.promise().query(
      `UPDATE Notification SET Statut = 'refusé' WHERE IDNotification = ?`,
      [notificationId]
    );
    res.redirect('/notifications');
  } catch (error) {
    console.error('Erreur refus troc :', error);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
