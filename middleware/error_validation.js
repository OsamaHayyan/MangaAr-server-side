import { validationResult, body, param } from "express-validator";
import bcrypt from "bcryptjs";
import { errorHandler } from "../error/errorsHandler.js";
import Auther from "../models/auther.js";
import Manga from "../models/manga.js";
import User from "../models/user.js";
import Category from "../models/category.js";

export const error_validation_multi = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }
};

export const error_validation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }
  next();
};

export const signup_validation = async (req, res, next) => {
  try {
    if (!req.file) {
      await signUpValidation(req);
      error_validation_multi(req);
    }
    next();
  } catch (error) {
    next(errorHandler(error));
  }
};
export const editeuser_validation = async (req, res, next) => {
  try {
    if (!req.file) {
      await editeUserValidation(req);
      error_validation_multi(req);
    }
    next();
  } catch (error) {
    next(errorHandler(error));
  }
};

export const manga_validation = async (req, res, next) => {
  try {
    const { image, banner } = req.files;
    if (!image && !banner) {
      await MangaValidation(req);
      error_validation_multi(req);
    }
    next();
  } catch (error) {
    next(errorHandler(error));
  }
};

//////// validation logic
const signUpValidation = async (req) => {
  try {
    await body("username", "Please add username with 4 characters at least")
      .isLength({ min: 4, max: 15 })
      .run(req);
    await body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .bail()
      .custom(async (value, { req }) => {
        const email = await User.exists({ email: value });
        if (email) {
          throw new Error("Email already Exists");
        }
      })
      .normalizeEmail()
      .run(req);
    await body(
      "password",
      "The Password should contain numbers, characters and symbols with at least 8 char length"
    )
      .isStrongPassword({ minUppercase: 0 })
      .run(req);
    await body("confirm")
      .custom((value, { req }) => {
        const password = req.body.password;
        if (value != password) {
          throw new Error("password confirmation is wrong");
        }
        return true;
      })
      .run(req);
  } catch (error) {
    next(errorHandler(error));
  }
};

const editeUserValidation = async (req) => {
  try {
    await body(
      "username",
      "Please add username with 3 charcter lenght at least"
    )
      .isLength({ min: 3 })
      .run(req);

    await body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .bail()
      .custom(async (value, { req }) => {
        const email = await User.exists({ email: value });
        if (email && value != req.user.email) {
          throw new Error("Email already Exists");
        }
        return true;
      })
      .normalizeEmail()
      .run(req);

    await body("password", "Password is wrong")
      .isStrongPassword({ minUppercase: 0 })
      .bail()
      .custom(async (value, { req }) => {
        const user = await User.findById(req.user.userId)
          .select("password -_id")
          .lean();
        const isEqual = await bcrypt.compare(value, user.password);
        if (!isEqual) {
          throw new Error("Password is wrong");
        }
        return true;
      })
      .run(req);
  } catch (error) {
    next(errorHandler(error));
  }
};

const MangaValidation = async (req) => {
  try {
    await param("mangaId", "Please add a valid Manga")
      .if((value) => value.length > 0)
      .isMongoId()
      .bail()
      .custom(async (mangaId, { req }) => {
        const mangaExistance = await Manga.exists({ _id: mangaId });
        if (!mangaExistance) {
          const message = "Please add a valid Manga";
          throw new Error(message);
        }
        return true;
      })
      .run(req);
    await body("title", "please add title with 5 charcters length at least")
      .isLength({ min: 5, max: 100 })
      .custom(async (title, { req }) => {
        const mangaId = req.params.mangaId;
        const titleExistance = await Manga.exists({
          title: { $regex: new RegExp("^" + title + "$", "i") },
        });
        if (titleExistance && !mangaId) {
          const message = "Title already Exists";
          throw new Error(message);
        } else if (mangaId) {
          const prevTitle = await Manga.exists({
            _id: mangaId,
            title: { $regex: new RegExp("^" + title + "$", "i") },
          });
          if (titleExistance && !prevTitle) {
            const message = "Title already Existss";
            throw new Error(message);
          }
        }
        return true;
      })
      .run(req);
    await body("story", "Please add story with 10 charcters length at least")
      .isLength({ min: 10 })
      .run(req);
    await body("status", "please choose one of this status")
      .toLowerCase()
      .default("on going")
      .custom(async (status, { req }) => {
        let allStatus = [
          "on going",
          "finished",
          "stopped",
          "مستمرة",
          "منتهية ",
          "متوقفة",
        ];
        if (!allStatus.includes(status)) {
          throw new Error("please choose one of this status");
        }
        return true;
      })
      .run(req);
    await body("date", "please add a valid Date")
      .toDate()
      .exists({ checkNull: true })
      .run(req);
    await body("category", "Please Add a valid category")
      .isMongoId()
      .bail()
      .custom(async (category, { req }) => {
        let cat;
        const catExistance = await Category.find({ _id: category })
          .select("_id")
          .lean();
        if (!Array.isArray(category)) {
          cat = [category];
        } else {
          cat = category;
        }
        if (!catExistance || catExistance.length < cat.length) {
          const message = "please add a valid category";
          throw new Error(message);
        }
        return true;
      })
      .run(req);
    await body("auther", "Please add an auther")
      .default(null)
      .if((value) => value != null)
      .isMongoId()
      .bail()
      .custom(async (auther, { req }) => {
        const autherExistance = await Auther.exists({ _id: auther });
        if (!autherExistance) {
          const message = "please add a valid auther";
          throw new Error(message);
        }
        return true;
      })
      .run(req);
  } catch (error) {
    next(errorHandler(error));
  }
};
