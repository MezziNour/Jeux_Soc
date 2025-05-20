const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.get("/games", apiController.searchGames);

module.exports = router;
