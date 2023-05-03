import path from "path";
import { errorCode, errorHandler } from "../error/errorsHandler.js";
import Auther from "../models/auther.js";
import Manga from "../models/manga.js";
import User from "../models/user.js";
import last_releases from "../models/last_releases.js";
import Category from "../models/category.js";
import { deleteDirAndFiles } from "../util/file.js";
import { isObjectId } from "../util/is_objectId.js";
import pagination from "../util/pagination.js";
import webpConvertion from "../util/webpConvertion.js";
import { PythonShell } from "python-shell";

// Order of sending text inputs and Images is too important ==>  Text input first then Images

export const createManga = async (req, res, next) => {
  try {
    const { image, banner } = req.files;
    if (!image) {
      if (banner) {
        await deleteDirAndFiles(banner[0].path);
      }
      const message = "please add image";
      const statusCode = 400;
      errorCode(message, statusCode);
    }

    //Returns [image, banner] or image
    const mangaWebpPath = banner
      ? await webpConvertion("manga_images", image[0].path, banner[0].path)
      : await webpConvertion("manga_images", image[0].path);

    const title = req.body.title;
    const story = req.body.story;
    const status = req.body.status;
    const date = req.body.date;
    const category = req.body.category;
    const auther = req.body.auther || null;
    const imageUrl = banner ? mangaWebpPath[0] : mangaWebpPath;
    const bannerUrl = banner ? mangaWebpPath[1] : null;

    const manga = await Manga.create({
      title: title,
      category: category,
      story: story,
      status: status,
      date: date.getFullYear(),
      auther: auther,
      image: imageUrl,
      banner: bannerUrl,
    });

    if (auther != null) {
      await Auther.updateOne(
        { _id: auther },
        {
          $push: { autherManga: manga._id },
        }
      ).lean();
    }

    await Category.updateMany(
      { _id: category },
      { $push: { catManga: manga._id } }
    ).lean();
    res.sendStatus(201);
    next();
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAllManga = async (req, res, next) => {
  try {
    let { catId, orderBy, page } = req.query;
    if (catId && catId != "all") await isObjectId(catId);
    const mangaCount =
      catId && catId != "all"
        ? await Manga.count({ category: catId })
        : await Manga.estimatedDocumentCount().lean();
    const mangaPages = Math.ceil(mangaCount / 20);
    catId =
      catId && catId != "all" ? { category: { $all: catId.split(",") } } : {};
    orderBy = req.query.orderBy;
    const pageNum = page ? page : 1;
    const { skip, PAGE_SIZE } = await pagination(pageNum, 20);

    let manga;
    switch (orderBy) {
      case "alphabet":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .select("views title image rate category")
          .populate("category")
          .collation({ locale: "en", strength: 1 })
          .sort({ title: 1 });
        break;
      case "view":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .select("views title image rate category")
          .populate("category")
          .sort({ views: -1 });
        break;
      case "new":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .sort({ createdAt: -1 })
          .select("views title image rate category")
          .populate("category");
        break;
      case "rate":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .sort({ rate: -1 })
          .select("views title image rate category")
          .populate("category");
        break;
      default:
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .select("views title image rate category")
          .populate("category", "category")
          .collation({ locale: "en", strength: 1 })
          .sort({ title: 1 });
        break;
    }
    return res.status(200).json({ mangaData: manga, mangaPages: mangaPages });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    const manga = await Manga.findByIdAndUpdate(
      mangaId,
      {
        $inc: { views: 1 },
      },
      { new: true, timestamps: false }
    )
      .populate("auther category", "category autherName")
      .select("-updatedAt -__v -createdAt -chapters.chapter");
    const recommendations = await PythonShell.run("util/recommendation.py", {
      args: [mangaId],
    });
    const recommendationManga = await Manga.find({
      _id: { $in: recommendations[0]?.split(" ") },
    })
      .select("title image views chapters")
      .lean();
    return res.status(200).json({ manga, recommendationManga });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const mostViewed = async (req, res, next) => {
  try {
    const manga = await Manga.find()
      .populate("category", "category")
      .select("views title image rate category chapters")
      .sort({ views: -1 })
      .limit(6);
    res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};
// Order of sending text inputs and Images is too important ==>  Text input first then Images
export const putManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    const title = req.body.title;
    const story = req.body.story;
    const status = req.body.status;
    const date = req.body.date;
    const category = req.body.category;
    const autherUpdated = req.body.auther || null;
    const { image, banner } = req.files;
    let imageUpdated = image
      ? await webpConvertion("manga_images", image[0].path)
      : undefined;
    let bannerUpdated = banner
      ? await webpConvertion("manga_images", banner[0].path)
      : undefined;

    const manga = await Manga.findById(mangaId)
      .select("title category auther image banner")
      .lean();

    const preAuth = manga.auther;
    const preCat = manga.category;

    //remove old image and banner
    if (imageUpdated) {
      await deleteDirAndFiles(manga.image);
    }
    if (bannerUpdated) {
      await deleteDirAndFiles(manga.banner);
    }

    await Manga.updateOne(
      { _id: mangaId },
      {
        title: title,
        story: story,
        status: status,
        date: date.getFullYear(),
        category: category,
        auther: autherUpdated,
        image: imageUpdated,
        banner: bannerUpdated,
      },
      { timestamps: false }
    ).lean();

    if (preAuth) {
      if (autherUpdated != preAuth) {
        await Auther.updateMany(
          { _id: preAuth },
          {
            $pull: { autherManga: mangaId },
          }
        ).lean();
        await Auther.updateOne(
          { _id: autherUpdated },
          {
            $push: { autherManga: mangaId },
          }
        ).lean();
      }
    } else {
      await Auther.updateOne(
        { _id: autherUpdated },
        {
          $push: { autherManga: mangaId },
        }
      ).lean();
    }

    await Category.updateMany(
      { _id: preCat },
      { $pull: { catManga: mangaId } }
    );

    await Category.updateMany(
      { _id: category },
      { $push: { catManga: mangaId } }
    );

    return res.status(200).json({ message: "success" });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;

    const manga = await Manga.findByIdAndDelete(mangaId)
      .select("chapters image banner category auther")
      .lean();

    if (!manga) {
      const message = "manga not found";
      errorCode(message, 400);
    }

    await Auther.updateMany(
      { _id: manga.auther },
      { $pull: { autherManga: mangaId } }
    ).lean();
    await Category.updateMany(
      { _id: manga.category },
      { $pull: { catManga: manga._id } }
    ).lean();
    await last_releases.deleteMany({ manga: mangaId }).lean();

    await User.updateMany(
      { $or: [{ favorite: mangaId }, { "recent.manga": mangaId }] },
      { $pull: { recent: { manga: mangaId }, favorite: mangaId } }
    ).lean();

    const mangaImage = path.join(manga.image);
    const mangaBanner = manga.banner ? path.join(manga.banner) : null;
    const dirChapters =
      manga.chapters.length != 0
        ? path.dirname(path.dirname(manga.chapters[0].chapter[0]))
        : null;
    await deleteDirAndFiles([mangaImage, mangaBanner, dirChapters]);

    return res.status(200).json({ message: "deleted succefully" });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const searchManga = async (req, res, next) => {
  try {
    const query = req.body.query;
    if (query === null) {
      errorCode("Expected string, found null", 500);
    }
    // for partial word search
    //const manga = await Manga.find({ title: { $regex: query, $options: "i" } })

    //for full word search
    const manga = await Manga.find(
      { $text: { $search: `\"${query}\"` } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .select("title image")
      .lean();
    return res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const postRating = async (req, res, next) => {
  try {
    const rating = req.body.rate; //number of star which was checked in client-side
    const { userId } = req.user;
    const mangaId = req.params.mangaId;
    const possibleResult = ["1", "2", "3", "4", "5"];
    const rateCheck = possibleResult.includes(rating.toString()); //check if valid rate
    const { rate: userRates } = await User.findById(userId)
      .select("rate")
      .lean();
    let prevUserRate;
    const notAcceptedRate =
      userRates.length > 0 &&
      userRates.some(
        (u) => u.mangaId == mangaId && u.rateNum.toString() == rating.toString()
      );
    if (notAcceptedRate) return res.status(200).json("done");
    const userRated =
      userRates.length > 0 &&
      userRates.some((el) => {
        if (el.mangaId == mangaId) {
          prevUserRate = el;
          return true;
        }
      });
    if (!rateCheck) {
      const message = "please add valid rate";
      errorCode(message, 400);
    }
    const rate = `rate.${rating}`;
    const updateRate =
      prevUserRate && prevUserRate.mangaId == mangaId
        ? await Manga.findByIdAndUpdate(
            { _id: mangaId },
            { $inc: { [rate]: 1, [`rate.${prevUserRate.rateNum}`]: -1 } },
            { new: true, timestamps: false }
          ).select("rate")
        : await Manga.findByIdAndUpdate(
            { _id: mangaId },
            { $inc: { [rate]: 1 } },
            { new: true, timestamps: false }
          ).select("rate");

    if (!updateRate) {
      return errorCode("Manga not found", 404);
    }
    if (userRated) {
      await User.updateOne(
        { _id: userId, "rate.mangaId": mangaId },
        {
          $set: { "rate.$.rateNum": rating },
        }
      );
    } else {
      await User.updateOne(
        { _id: userId },
        {
          $push: { rate: { mangaId: mangaId, rateNum: rating } },
        }
      );
    }
    const finallRate = await updateRate.rate;
    res.status(200).json(finallRate);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getRating = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    const rating = await Manga.findOne({ _id: mangaId }).select("rate");
    if (!rating) {
      return errorCode("Manga not found", 404);
    }
    const rateResult = await rating.rate;
    res.status(200).json({ rate: rateResult });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const mangaId = await Manga.find()
      .sort({ views: -1 })
      .limit(1)
      .lean()
      .select("_id");
    const recommendations = await PythonShell.run("util/recommendation.py", {
      args: [mangaId[0]._id],
    });
    const recommendationManga = await Manga.find({
      _id: { $in: recommendations[0]?.split(" ") },
    })
      .select("title image views chapters")
      .lean();
    return res.status(200).json(recommendationManga);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getTrendy = async (req, res, next) => {
  try {
    const trendy = [];
    const categories = [
      { cateogry: "Action", _id: "63f3a61b0e7402c84cebde7a" },
      { cateogry: "Romance", _id: "63f3a61b0e7402c84cebdeae" },
      { cateogry: "Drama", _id: "63f3a61b0e7402c84cebde86" },
    ];
    for (let i = 0; i < categories.length; i++) {
      const mangaData = await Manga.find({ category: categories[i]._id })
        .limit(5)
        .select("views title image rate chapters");

      trendy.push({ category: categories[i].cateogry, manga: mangaData });
    }

    res.status(200).json(trendy);
  } catch (error) {
    next(errorHandler(error));
  }
};
