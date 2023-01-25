import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";
import Auther from "../models/auther.js";
import Manga from "../models/manga.js";
import User from "../models/user.js";
import News from "../models/news.js";
import Category from "../models/category.js";
import { body, param } from "express-validator";
import { error_validation_multi } from "./error_validation.js";
import __dirname from "../util/__dirname.js";

const fileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let failed = false;

    try {
      switch (file.fieldname) {
        case "photos": {
          const mangaId = req.body.mangaId;
          const chapterNum = req.body.chapterNum;

          await chapterValidation(req, file);
          error_validation_multi(req);

          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "chapters",
            mangaId,
            chapterNum
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          return cb(null, `public/chapters/${mangaId}/${chapterNum}`);
        }

        case "profile_photo": {
          await signUpValidation(req);
          error_validation_multi(req);
          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "profile_photo"
          );
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          return cb(null, `public/profile_photo`);
        }

        case "edite_profile_photo": {
          await editeUserValidation(req);
          error_validation_multi(req);

          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "profile_photo"
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          return cb(null, `public/profile_photo`);
        }

        case "poster": {
          await newsValidation(req);
          error_validation_multi(req);

          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "news"
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          return cb(null, `public/news`);
        }

        case "image": {
          //Order in request here is important, text first then image

          await MangaValidation(req);
          error_validation_multi(req);

          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "manga_images"
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          return cb(null, `public/manga_images/`);
        }

        case "banner": {
          //Order in request here is important, text first then image

          await MangaValidation(req);
          error_validation_multi(req);

          const dir = path.join(
            __dirname(import.meta.url),
            "..",
            "public",
            "manga_images"
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          return cb(null, `public/manga_images/`);
        }
      }
    } catch (error) {
      failed = true;
      cb(error, false);
    } finally {
      if (file.fieldname === "photos") {
        const mangaId = req.body.mangaId;
        const chapterNum = req.body.chapterNum;
        const dir = path.join("public", "chapters", mangaId, chapterNum);
        // if (failed) {
        //   deleteDir(dir);
        // }
      }
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.split(".")[0] +
        "-" +
        new Date().toISOString().replace(/:/g, "-") +
        path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    const message = "image extention isn't valid";
    let error = new Error(message);
    error.statusCode = 403;
    cb(error, false);
  }
};

export default multer({
  storage: fileStorage,
  fileFilter: fileFilter,
});

/////// Validation Func

const chapterValidation = async (req, file) => {
  try {
    await body("mangaId", "please add a valid id").isMongoId().run(req);
    await body("chapterNum")
      .isFloat()
      .custom(async (chapterNum, { req }) => {
        try {
          const mangaId = req.body.mangaId;
          const mangaExistance = await Manga.exists({ _id: mangaId });
          if (!mangaExistance) {
            const message = "No Manga found";
            throw new Error(message);
          }

          const chapterExistance = await Manga.exists({
            _id: mangaId,
            "chapters.chapterNum": chapterNum,
          });

          if (chapterExistance) {
            const message = "Chapters existes";
            throw new Error(message);
          }

          if (isNaN(path.parse(file.originalname).name)) {
            const message = "Please change image name to a number";
            throw new Error(message);
          }
        } catch (error) {
          throw error;
        }
      })
      .run(req);
  } catch (error) {
    throw error;
  }
};

const signUpValidation = async (req) => {
  try {
    await body("username", "Please add username with 5 characters at least")
      .isLength({ min: 5 })
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
      .matches(/^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%\^&\*\_])(?=.{8,})/)
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
    throw error;
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
    throw error;
  }
};

const MangaValidation = async (req) => {
  try {
    await body("mangaId")
      .if((value) => value.length > 0)
      .isMongoId()
      .bail()
      .custom(async (mangaId, { req }) => {
        const mangaExistance = await Manga.exists({ _id: mangaId });
        if (!mangaExistance) {
          const message = "Please add a valid Manga";
          throw new Error(message);
        }
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
            const message = "Title already Exists";
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
    throw error;
  }
};

const newsValidation = async (req) => {
  try {
    await body("title", "Please write the title").isLength({ min: 5 }).run(req);
    await body("topic", "Please write the topic")
      .isLength({ min: 10 })
      .run(req);
    await param("newsId", "Please Choose correct news")
      .if((value) => {
        if (value) {
          return true;
        }
        return false;
      })
      .isMongoId()
      .custom(async (newsId, { req }) => {
        try {
          const newsExist = await News.exists({ _id: newsId });
          if (!newsExist) {
            throw new Error("News Not Found");
          }
          return true;
        } catch (error) {
          throw error;
        }
      })
      .run(req);
  } catch (error) {
    throw error;
  }
};
