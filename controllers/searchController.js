const db = require("../config/db");

exports.renderSearch = async (req, res, next) => {
  try {
    const [genres] = await db
      .promise()
      .query("SELECT IDGenre, NomGenre FROM CategorieGenre ORDER BY NomGenre");
    const [ages] = await db
      .promise()
      .query("SELECT IDAge, AgeMin FROM CategorieAge ORDER BY AgeMin");

    res.render("index", {
      title: "Home",
      genres,
      ages,
      filters: {
        keywords: "",
        genres: [],
        ages: [],
        minPlayers: "",
        maxPlayers: "",
      },
      results: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.doSearch = async (req, res, next) => {
  try {
    const {
      keywords,
      genres = [],
      ages = [],
      minPlayers,
      maxPlayers,
    } = req.query;

    // Construction dynamique de la requête
    let sql = `
      SELECT DISTINCT j.IDJeu, j.NomJeu, j.Image
        FROM Jeu j
        LEFT JOIN Appartenir a ON j.IDJeu = a.IDJeu
       WHERE 1=1
    `;
    const params = [];

    if (keywords) {
      sql += ` AND MATCH(j.NomJeu) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.push(keywords);
    }

    if (Array.isArray(genres) && genres.length) {
      sql += ` AND a.IDGenre IN (${genres.map(() => "?").join(",")})`;
      params.push(...genres);
    }

    if (Array.isArray(ages) && ages.length) {
      sql += ` AND j.IDAge IN (${ages.map(() => "?").join(",")})`;
      params.push(...ages);
    }

    if (minPlayers) {
      sql += ` AND j.NbJoueursMax >= ?`;
      params.push(minPlayers);
    }
    if (maxPlayers) {
      sql += ` AND j.NbJoueursMin <= ?`;
      params.push(maxPlayers);
    }

    sql += ` LIMIT 50`;

    const [results] = await db.promise().query(sql, params);

    // recharger genres & ages pour réafficher les filtres cochés
    const [genresList] = await db
      .promise()
      .query("SELECT IDGenre, NomGenre FROM CategorieGenre ORDER BY NomGenre");
    const [agesList] = await db
      .promise()
      .query("SELECT IDAge, AgeMin FROM CategorieAge ORDER BY AgeMin");

    res.render("index", {
      title: "Home",
      genres: genresList,
      ages: agesList,
      filters: { keywords, genres, ages, minPlayers, maxPlayers },
      results,
    });
  } catch (err) {
    next(err);
  }
};
