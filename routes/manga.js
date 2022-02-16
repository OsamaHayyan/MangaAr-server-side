const express = require("express");
const router = express.Router();

const {
  createManga,
  getManga,
  putManga,
  deleteManga,
  getAllManga,
  searchManga,
  mostViewed,
  postRating,
  getRating,
} = require("../controllers/manga");
const {
  manga_validation,
  error_validation,
} = require("../middleware/error_validation");
const { is_admin, is_superuser } = require("../middleware/authorisation");
const { param, query } = require("express-validator");

const uploads = require("../middleware/uploads").fields([
  { name: "image", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

/*
@GET: /mangas/
@Admin
@Query: {
  CatId: _id ==> optional,
  orderBy: (alphabet, view, new, rate),
  page: string or number ==> optional,
}
@Response: {
  title: String,
  category: Array of strings
  story: String
  image: String
  banner: String
  status: String
  date: String
  auther: String
  views: String
  rate: String,
  createdAt: String
}
*/
router.get(
  "/",
  // query("catId", "Please choose valid category")
  //   .if((value) => {
  //     if (value) {
  //       return true;
  //     }
  //     return false;
  //   })
  //   .isMongoId(),
  // error_validation,
  getAllManga
);

/*
@POST: /mangas/add
@Admin
@Request: {
  Title: { min: 5, max: 100 } ==> required,
  Story: { min: 10 } ==> required,
  status: {"on going" || "finished" || "stopped" ||  "مستمرة" || "منتهية " || "متوقفة"} ==> required,
  date: String Date ==> required,
  category: string or array of strings ==> required,
  auther: _id as string ==> required,
  imageUrl: string path ==> required,
  bannerUrl: string path ==> optional
},
@Response: {
  message: "success"
}
*/
router.post("/add", is_admin, uploads, manga_validation, createManga);

router.get(
  "/manga/:mangaId",
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  getManga
);

router.get("/most-viewed", mostViewed);

router.put("/manga/:mangaId", is_admin, uploads, manga_validation, putManga);

router.delete(
  "/delete/:mangaId",
  is_superuser,
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  deleteManga
);

router.post("/search-manga", searchManga);

router.post(
  "/rate/:mangaId",
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  postRating
);

router.get(
  "/rate/:mangaId",
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  getRating
);

module.exports = router;
