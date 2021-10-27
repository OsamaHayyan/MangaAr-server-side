const express = require("express");
const { param } = require("express-validator");
const {
  postNews,
  getAllNews,
  getNews,
  putNews,
  deleteNews,
} = require("../controllers/news");
const { is_superuser } = require("../middleware/authorisation");
const { error_validation } = require("../middleware/error_validation");
const router = express.Router();
const uploads = require("../middleware/uploads").single("poster");

router.post("/create-news", is_superuser, uploads, error_validation, postNews);

router.get("/", getAllNews);

router.get(
  "/get-news/:newsId",
  param("newsId", "Please Choose correct news").isMongoId(),
  error_validation,
  getNews
);

router.put(
  "/put-news/:newsId",
  is_superuser,
  uploads,
  error_validation,
  putNews
);

router.delete(
  "/delete-news/:newsId",
  is_superuser,
  param("newsId", "Please Choose correct news").isMongoId(),
  error_validation,
  deleteNews
);

module.exports = router;
