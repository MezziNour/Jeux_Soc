const db = require("../config/db");

exports.searchGames = async (req, res) => {
  try {
    console.log("⮕ API /api/games called with", req.query);
    const { keywords, genres, ages, minPlayers, maxPlayers } = req.query;

    // Base SELECT
    let sql = `
      SELECT DISTINCT j.IDJeu, j.NomJeu, j.Image
      FROM Jeu j
    `;
    const joins = [];
    const wheres = [];
    const params = [];

    // Si on filtre par genre
    if (genres) {
      // genres peut être string ou array
      const list = Array.isArray(genres) ? genres : [genres];
      joins.push("JOIN Appartenir a ON j.IDJeu = a.IDJeu");
      wheres.push(`a.IDGenre IN (${list.map(() => "?").join(",")})`);
      params.push(...list);
    }

    // Si on filtre par âge
    if (ages) {
      const list = Array.isArray(ages) ? ages : [ages];
      wheres.push(`j.IDAge IN (${list.map(() => "?").join(",")})`);
      params.push(...list);
    }

    // Nombre de joueurs min
    if (minPlayers) {
      wheres.push("j.NbJoueursMin >= ?");
      params.push(minPlayers);
    }
    // Nombre de joueurs max
    if (maxPlayers) {
      wheres.push("j.NbJoueursMax <= ?");
      params.push(maxPlayers);
    }

    // Mot-clé sur le nom du jeu
    if (keywords) {
      wheres.push("j.NomJeu LIKE ?");
      params.push(`%${keywords}%`);
    }

    // Assemble la requête
    if (joins.length) sql += joins.join("\n");
    if (wheres.length) sql += " WHERE " + wheres.join(" AND ");
    sql += " ORDER BY j.NomJeu LIMIT 100";

    console.log("🔍 Final SQL:", sql, params);
    const [rows] = await db.promise().query(sql, params);

    res.json(rows);
  } catch (err) {
    console.error("Error in searchGames:", err);
    res.status(500).json({ error: err.message });
  }
};
