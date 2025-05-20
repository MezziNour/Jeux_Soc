const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res, next) => {
  try {
    // 1) Récupérer toutes les catégories de genre
    const [genres] = await db
      .promise()
      .query("SELECT IDGenre, NomGenre FROM CategorieGenre ORDER BY NomGenre");
    // 2) Récupérer toutes les catégories d’âge
    const [ages] = await db
      .promise()
      .query("SELECT IDAge, AgeMin FROM CategorieAge ORDER BY AgeMin");
    // 3) Rendre la vue avec ces données
    res.render("index", {
      title: "Home",
      genres,
      ages,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
