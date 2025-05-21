const db = require("../config/db");

async function ensureIndex(table, indexName, definition) {
  // Vérifie si l'index existe déjà
  const [rows] = await db.promise().query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.statistics
      WHERE table_schema = ?
        AND table_name = ?
        AND index_name = ?`,
    [db.config.database, table, indexName]
  );
  if (rows[0].cnt === 0) {
    console.log(`Création de l’index ${indexName} sur ${table}…`);
    await db.promise().query(`ALTER TABLE \`${table}\` ADD ${definition}`);
  } else {
    console.log(`Index ${indexName} déjà existant sur ${table}, skip.`);
  }
}

async function setupSearch() {
  try {
    // index
    await ensureIndex(
      "Jeu",
      "idx_fulltext_nom",
      "FULLTEXT INDEX `idx_fulltext_nom` (`NomJeu`)"
    );
    await ensureIndex("Jeu", "idx_age", "INDEX `idx_age` (`IDAge`)");
    await ensureIndex(
      "Jeu",
      "idx_nb_jmin",
      "INDEX `idx_nb_jmin` (`NbJoueursMin`)"
    );
    await ensureIndex(
      "Jeu",
      "idx_nb_jmax",
      "INDEX `idx_nb_jmax` (`NbJoueursMax`)"
    );
    await ensureIndex(
      "Appartenir",
      "idx_appartenir_genre",
      "INDEX `idx_appartenir_genre` (`IDGenre`)"
    );

    // vues
    console.log("Recréation de la vue ViewJeuxParGenre…");
    await db.promise().query("DROP VIEW IF EXISTS `ViewJeuxParGenre`");
    await db.promise().query(`
      CREATE VIEW \`ViewJeuxParGenre\` AS
      SELECT j.*
        FROM \`Jeu\` j
        JOIN \`Appartenir\` a ON j.IDJeu = a.IDJeu;
    `);

    console.log("Recréation de la vue ViewJeuxParAge…");
    await db.promise().query("DROP VIEW IF EXISTS `ViewJeuxParAge`");
    await db.promise().query(`
      CREATE VIEW \`ViewJeuxParAge\` AS
      SELECT j.*
        FROM \`Jeu\` j
        JOIN \`CategorieAge\` ag ON j.IDAge = ag.IDAge;
    `);

    console.log("Index et vues de recherche configurés avec succès.");
    process.exit(0);
  } catch (err) {
    console.error("Erreur lors de la configuration search:", err);
    process.exit(1);
  }
}

setupSearch();
