const express = require("express");
const router = express.Router();
const apiCtrl = require("../controllers/apiController");

router.get("/games", apiCtrl.searchGames);

module.exports = router;
