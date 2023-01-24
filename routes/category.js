import { Router } from "express";
import { body, param } from "express-validator";
import Category from "../models/category.js";
import { is_superuser } from "../middleware/authorisation.js";
import { error_validation } from "../middleware/error_validation.js";
import {
  createCategory,
  modifyCat,
  getCat,
  deleteCat,
  getAllCat,
} from "../controllers/category.js";

const router = Router();

router.post(
  "/create-cat/",
  is_superuser,
  body("category").custom(async (cat, { req }) => {
    try {
      if (!cat) {
        const message = "Please add a category";
        throw new Error(message);
      }

      const pastCat = await Category.exists({
        category: { $regex: new RegExp("^" + cat + "$", "i") },
      });

      if (pastCat) {
        const message = "category already exist";
        throw new Error(message);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }),
  error_validation,
  createCategory
);

router.get("/get-cat/", getAllCat);

router.get(
  "/get-cat/:catId/",
  param("catId", "please add a valid category").isMongoId(),
  error_validation,
  getCat
);

router.put(
  "/put-cat/:catId/",
  is_superuser,
  param("catId", "please add a valid category").isMongoId(),
  error_validation,
  body("category", "category length should be 3 chars at least")
    .isAlpha()
    .isLength({ min: 3 })
    .custom(async (catName, { req }) => {
      try {
        const catId = req.params.catId;
        const catExistance = await Category.exists({ _id: catId });
        if (!catExistance) {
          const message = "There's no category with this name";
          throw new Error(message);
        }

        const catsNames = await Category.exists({
          category: { $regex: new RegExp("^" + catName + "$", "i") },
        });
        const prevCatName = await Category.exists({
          _id: catId,
          category: { $regex: new RegExp("^" + catName + "$", "i") },
        });

        //don't update if the name already exist and isn't name of same category
        if (catsNames && !prevCatName) {
          const message = "Category Name already exist";
          throw new Error(message);
        }
        return true;
      } catch (error) {
        throw error;
      }
    }),
  error_validation,
  modifyCat
);

router.delete(
  "/delete-cat/:catId/",
  is_superuser,
  param("catId", "please add a valid category").isMongoId(),
  error_validation,
  deleteCat
);

export default router;
