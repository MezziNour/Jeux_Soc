const db = require("../config/db");

exports.searchGames = async (req, res) => {
  try {
    console.log("⮕ API /api/games called with", req.query);
    const { keywords, genres, ages, minPlayers, maxPlayers } = req.query;

    // Convertir genres et ages en chaînes CSV
    const genreCsv = Array.isArray(genres) ? genres.join(",") : genres || "";
    const ageCsv = Array.isArray(ages) ? ages.join(",") : ages || "";

    // Parser les bornes de joueurs ou mettre à null
    const minP = minPlayers ? parseInt(minPlayers, 10) : null;
    const maxP = maxPlayers ? parseInt(maxPlayers, 10) : null;

    console.log("🔍 Calling stored proc SearchGames with", {
      keywords,
      genreCsv,
      ageCsv,
      minP,
      maxP,
    });

    // Appel de la procédure stockée
    const [resultSets] = await db
      .promise()
      .query("CALL SearchGames(?, ?, ?, ?, ?)", [
        keywords || "",
        genreCsv,
        ageCsv,
        minP,
        maxP,
      ]);

    // MySQL renvoie un tableau de jeux de résultats, le premier contient nos lignes
    const games = resultSets[0];

    res.json(games);
  } catch (err) {
    console.error("Error in searchGames:", err);
    res.status(500).json({ error: err.message });
  }
};
