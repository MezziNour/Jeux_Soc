const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',      
  user: 'root',       
  password: 'nounours',
  database: 'app_jeux_soc'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

module.exports = db;
