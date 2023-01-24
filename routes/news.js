import { Router } from "express";
import { param } from "express-validator";
import {
  postNews,
  getAllNews,
  getNews,
  putNews,
  deleteNews,
} from "../controllers/news.js";
import { is_superuser } from "../middleware/authorisation.js";
import { error_validation } from "../middleware/error_validation.js";
import uploadMiddleware from "../middleware/uploads.js";
const uploads = uploadMiddleware.single("poster");
const router = Router();

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

export default router;
