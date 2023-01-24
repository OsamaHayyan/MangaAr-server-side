import { Router } from "express";
import { body, param } from "express-validator";

import {
  createAuther,
  deleteAuther,
  getAuther,
  modifyAuther,
  getAllAuthers,
} from "../controllers/auther.js";
import Auther from "../models/auther.js";
import { is_superuser } from "../middleware/authorisation.js";
import { error_validation } from "../middleware/error_validation.js";

const router = Router();

router.post(
  "/add",
  is_superuser,
  body("name", "Please add name with 3 charcter lenght at least")
    .isLength({ min: 3, max: 50 })
    .custom(async (name, { req }) => {
      try {
        const autherExistance = await Auther.exists({
          autherName: { $regex: new RegExp("^" + name + "$", "i") },
        });
        if (autherExistance) {
          const message = "auther already exist";
          throw new Error(message);
        }
        return true;
      } catch (error) {
        throw error;
      }
    }),
  error_validation,
  createAuther
);

router.get(
  "/auther/:autherId",
  param("autherId", "please add a valid auther").isMongoId(),
  error_validation,
  getAuther
);

router.get("/get-authers", getAllAuthers);

router.put(
  "/auther/:autherId",
  is_superuser,
  [
    param("autherId", "please add a valid auther").isMongoId(),
    body("name", "Please add username with 3 charcter lenght at least")
      .isLength({ min: 3, max: 50 })
      .custom(async (name, { req }) => {
        try {
          const autherExistance = await Auther.exists({
            autherName: { $regex: new RegExp("^" + name + "$", "i") },
          });
          const autherNameIsSame = await Auther.exists({
            _id: req.params.autherId,
            autherName: { $regex: new RegExp("^" + name + "$", "i") },
          });
          console.log(autherNameIsSame);
          if (autherExistance && !autherNameIsSame) {
            const message = "auther already exist";
            throw new Error(message);
          }
          return true;
        } catch (error) {
          throw error;
        }
      }),
  ],
  error_validation,
  modifyAuther
);

router.delete(
  "/delete/:autherId",
  is_superuser,
  param("autherId", "please add a valid auther").isMongoId(),
  error_validation,
  deleteAuther
);

export default router;
