const express = require("express");
const multer = require("multer");
const {
  createChapter,
  getChapter,
  deleteChapter,
} = require("../controllers/chapter");

const { errorHandler } = require("../error/errorsHandler");
const router = express.Router();
const uploads = require("../middleware/uploads").array("photos", 100);
const { is_admin, logedin } = require("../middleware/authorisation");

router.post("/add-chapter", is_admin, uploads, createChapter);

router.get("/get-chapter/:chapterId", logedin, getChapter);

router.delete("/delete-chapter/:chapterId", is_admin, deleteChapter);

module.exports = router;
