import { Router } from "express";
import {
  createManga,
  getManga,
  putManga,
  deleteManga,
  getAllManga,
  searchManga,
  mostViewed,
  postRating,
  getRating,
  getRecommendations,
  getTrendy,
} from "../controllers/manga.js";
import {
  manga_validation,
  error_validation,
} from "../middleware/error_validation.js";
import {
  is_admin,
  is_auth,
  is_superuser,
} from "../middleware/authorisation.js";
import { param } from "express-validator";
import uploadMiddleware from "../middleware/uploads.js";
import createRecommendationModel from "../middleware/createRecommendationModel.js";

const router = Router();
const uploads = uploadMiddleware.fields([
  { name: "image", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

/*
@GET: /mangas/
@User
@Query: {
  CatId: _id ==> optional,
  orderBy: (alphabet, view, new, rate),
  page: string or number ==> optional,
}
@Response:  {
   "mangaData": [
        {
            "_id": String,
            "title": String,
            "image": String,
            "views": Int
        }
      ],
    "mangaPages": Int
}
*/
router.get("/", getAllManga);

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
  image: string path ==> required,
  banner: string path ==> optional
},
@Response: {
  message: "success"
}
*/
router.post(
  "/add",
  is_admin,
  uploads,
  manga_validation,
  createManga,
  createRecommendationModel
);

/*
@GET: /mangas/manga/:mangaId
@User
@Params: mangaId
@Response: {
  title: String,
  category: [
        {
            "_id": String,
            "category": String
        }
    ]
  story: String
  image: String
  banner: String
  status: String
  date: String
  auther: String
  views: Int
  rate: Int,
  chapters: [
        {
            "chapterNum": String,
            "name": String,
            "views": Int,
            "date": String,
            "_id": String
        }
}     ]
*/
router.get(
  "/manga/:mangaId",
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  getManga
);

/*
@GET: /mangas/most-viewed
@User
@Response: [
  {
      "_id": String,
      "title": String,
      "image": String,
      "views": Int
  }
]
*/
router.get("/most-viewed", mostViewed);

/*
@PUT: /mangas/manga/:mangaId"
@Admin
@Params: mangaId
@Request: {
  Title: { min: 5, max: 100 } ==> required,
  Story: { min: 10 } ==> required,
  status: {"on going" || "finished" || "stopped" ||  "مستمرة" || "منتهية " || "متوقفة"} ==> required,
  date: String Date ==> required,
  category: string or array of strings ==> required,
  auther: _id as string ==> required,
  image: string path ==> optional,
  banner: string path ==> optional
},
@Response: { message: "success" }
*/
router.put("/manga/:mangaId", is_admin, uploads, manga_validation, putManga);

/*
@DELETE: /mangas/delete/:mangaId
@Super_User
@Params: mangaId
@Request: {
  mangaId: String ==> Required
},
@Response: { message: "deleted succefully" }
*/
router.delete(
  "/delete/:mangaId",
  is_superuser,
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  deleteManga
);

/*
@POST: /mangas/search-manga
@User
@Request: {
  query : String ==> Required
},
@Response: [
    {
        "_id": String,
        "title": String,
        "image": String
    }
  ]
*/
router.post("/search-manga", searchManga);

/*
@POST: /mangas/rate/:mangaId
@User
@Params: mangaId
@Request: {
  query : String ==> Required
},
@Response: {
    "rate": String number
  }
*/
router.post(
  "/rate/:mangaId",
  is_auth,
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  postRating
);

/*
@GET: /mangas/rate/:mangaId
@User
@Params: mangaId
@Response: {
    "rate": Int
  }
*/
router.get(
  "/rate/:mangaId",
  param("mangaId", "Manga Not Found").isMongoId(),
  error_validation,
  getRating
);

router.get("/recommendation/", getRecommendations);

router.get("/trendy", getTrendy);

export default router;
