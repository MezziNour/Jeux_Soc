const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res, next) => {
  try {
    //Récupérer toutes les catégories de genre
    const [genres] = await db
      .promise()
      .query("SELECT IDGenre, NomGenre FROM CategorieGenre ORDER BY NomGenre");
    //Récupérer toutes les catégories d’âge
    const [ages] = await db
      .promise()
      .query("SELECT IDAge, AgeMin FROM CategorieAge ORDER BY AgeMin");
    //Récupérer top 10 les plus récents
    const [recents] = await db.promise().query("SELECT * FROM VueTopRecents");
    //Rendre la vue avec ces données
    res.render("index", {
      title: "Jeu",
      genres,
      ages,
      recents,
      userId: req.session.userId,
      showLogout: false
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
