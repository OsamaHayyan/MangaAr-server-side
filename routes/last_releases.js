const express = require("express");
const { query } = require("express-validator");
const { lastReleases } = require("../controllers/last_releases");
const { error_validation } = require("../middleware/error_validation");
const router = express.Router();

router.get(
  "/",
  query("page", "please send and integer").default(1).isInt({ min: 1 }),
  error_validation,
  lastReleases
);

module.exports = router;
