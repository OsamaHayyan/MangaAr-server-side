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

/*
@POST: /news/create-news/
@Super_User
@Request : {
  "topic": String,
  "title": String,
  "poster": File
}
@Response: "success"
*/
router.post("/create-news", is_superuser, uploads, error_validation, postNews);

/*
@GET: /news/
@user
@Query: {
  page: string or number ==> optional,
}
@Response:
{
 news: [{
  "_id": string,
  "title": string,
  "topic": string,
  "poster": string,
  "createdAt": string,
  "updatedAt": string,
}]
 newsPages: string
}
*/
router.get("/", getAllNews);

/*
@GET: /news/get-news/:newsId
@User
@Params: newsId
@Response: {
  "_id": string,
  "title": string,
  "topic": string,
  "poster": string,
  "createdAt": string,
  "updatedAt": string,
}
*/
router.get(
  "/get-news/:newsId",
  param("newsId", "Please Choose correct news").isMongoId(),
  error_validation,
  getNews
);

/*
@PUT: /news/put-news/:newsId
@Super_User
@Params: newsId
@Request : {
  "topic": String,
  "title": String,
  "poster": File
}
@Response: {
  "_id": string,
  "title": string,
  "topic": string,
  "poster": string,
  "createdAt": string,
  "updatedAt": string,
}
*/
router.put(
  "/put-news/:newsId",
  is_superuser,
  uploads,
  error_validation,
  putNews
);

/*
@DELETE: /news/delete-news/:newsId
@Super_User
@Params: newsId
@Request : {
  "topic": String,
  "title": String,
  "poster": File
}
@Response: "Deleted"
*/
router.delete(
  "/delete-news/:newsId",
  is_superuser,
  param("newsId", "Please Choose correct news").isMongoId(),
  error_validation,
  deleteNews
);

module.exports = router;
