const { Types } = require("mongoose");
const path = require("path");
const { errorCode, errorHandler } = require("../error/errorsHandler");
const Auther = require("../models/auther");
const Manga = require("../models/manga");
const Category = require("../models/category");
const last_releases = require("../models/last_releases");
const User = require("../models/user");

const { deleteFile, deleteDir } = require("../util/file");
const { isObjectId } = require("../util/is_objectId");
const { pagination } = require("../util/pagination");

// Order of sending text inputs and Images is too important ==>  Text input first then Images

exports.createManga = async (req, res, next) => {
  try {
    const { image, banner } = req.files;
    if (!image) {
      if (banner) {
        deleteFile(banner[0].path);
      }
      const message = "please add image";
      const statusCode = 400;
      errorCode(message, statusCode);
    }
    const title = req.body.title;
    const story = req.body.story;
    const status = req.body.status;
    const date = req.body.date;
    const category = req.body.category;
    const auther = req.body.auther || null;
    const imageUrl = image[0].path;
    const bannerUrl = banner ? banner[0].path : null;

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
    return res.status(201).json({ message: "success" });
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.getAllManga = async (req, res, next) => {
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
          .select("views title image")
          .collation({ locale: "en", strength: 1 })
          .sort({ title: 1 })
          .lean();
        break;
      case "view":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .select("views title image")
          .sort({ views: -1 })
          .lean();
        break;
      case "new":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .sort({ createdAt: -1 })
          .select("views title image")
          .lean();
        break;
      case "rate":
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .sort({ rate: -1 })
          .select("views title image")
          .lean();
        break;
      default:
        manga = await Manga.find(catId)
          .skip(skip)
          .limit(PAGE_SIZE)
          .select("views title image")
          .collation({ locale: "en", strength: 1 })
          .sort({ title: 1 })
          .lean();
        break;
    }
    return res.status(200).json({ mangaData: manga, mangaPages: mangaPages });
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.getManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;

    const manga = await Manga.findByIdAndUpdate(
      mangaId,
      {
        $inc: { views: 1 },
      },
      { new: true }
    )
      .populate("auther category", "category autherName")
      .select("-updatedAt -__v -createdAt")
      .lean();

    const rate = manga.rate;
    const rateResult =
      (1 * rate[1] + 2 * rate[2] + 3 * rate[3] + 4 * rate[4] + 5 * rate[5]) /
      (rate[1] + rate[2] + rate[3] + rate[4] + rate[5]);
    manga.rate = rateResult.toFixed(1);
    return res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.mostViewed = async (req, res, next) => {
  try {
    const manga = await Manga.find()
      .select("views title image")
      .sort({ views: -1 })
      .limit(5)
      .lean();
    res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};
// Order of sending text inputs and Images is too important ==>  Text input first then Images
exports.putManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    const title = req.body.title;
    const story = req.body.story;
    const status = req.body.status;
    const date = req.body.date;
    const category = req.body.category;
    const autherUpdated = req.body.auther || null;
    const { image, banner } = req.files;
    let imageUpdated = image ? image[0].path : null;
    let bannerUpdated = banner ? banner[0].path : undefined;

    const manga = await Manga.findById(mangaId)
      .select("title category auther image banner")
      .lean();

    //delete image or banner if there is an error during process
    if (!imageUpdated) {
      if (bannerUpdated) {
        deleteFile(bannerUpdated);
      }
      const message = "please add image";
      const statusCode = 400;
      errorCode(message, statusCode);
    }

    const preAuth = manga.auther;
    const preCat = manga.category;

    //remove old image and banner
    if (imageUpdated) {
      deleteFile(manga.image);
      if (bannerUpdated && manga.banner != null) {
        deleteFile(manga.banner);
      }
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
      }
    ).lean();

    if (preAuth) {
      if (autherUpdated != preAuth) {
        await Auther.updateOne(
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

exports.deleteManga = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;

    const manga = await Manga.findByIdAndDelete(mangaId)
      .select("chapters image category auther")
      .lean();

    if (!manga) {
      const message = "manga not found";
      errorCode(message, 400);
    }
    await Auther.updateOne(
      { _id: manga.auther },
      { $pull: { autherManga: mangaId } }
    ).lean();
    await Category.updateMany(
      { _id: manga.category },
      { $pull: { catManga: manga._id } }
    ).lean();
    await last_releases.deleteOne({ manga: mangaId }).lean();

    await User.updateMany(
      { $or: [{ favorite: mangaId }, { "recent.manga": mangaId }] },
      { $pull: { recent: { manga: mangaId }, favorite: mangaId } }
    ).lean();

    const dirImage = path.dirname(manga.image);
    const dirChapters =
      manga.chapters.length != 0
        ? path.dirname(path.dirname(manga.chapters[0].chapter[0]))
        : null;
    await deleteDir([dirImage, dirChapters]);

    return res.status(200).json({ message: "deleted succefully" });
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.searchManga = async (req, res, next) => {
  try {
    const query = req.body.query;
    if (query === null) {
      errorCode("Expected string, found null", 500);
    }
    const manga = await Manga.find({ $text: { $search: query } })
      .select("title image")
      .limit(5)
      .lean();
    return res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.postRating = async (req, res, next) => {
  try {
    const rating = req.body.rate;
    const mangaId = req.params.mangaId;
    const possibleResult = ["1", "2", "3", "4", "5"];
    const rateCheck = possibleResult.includes(rating.toString());
    if (!rateCheck) {
      const message = "please add valid rate";
      errorCode(message, 400);
    }
    const rate = `rate.${rating}`;
    const updateRate = await Manga.findByIdAndUpdate(
      { _id: mangaId },
      { $inc: { [rate]: 1 } },
      { new: true }
    ).select("rate");
    const finallRate = await updateRate.rate;
    res.status(200).json(finallRate);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.getRating = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    const rating = await Manga.findOne({ _id: mangaId }).select("rate");
    const rateResult = await rating.rate;
    res.status(200).json(rateResult);
  } catch (error) {
    next(errorHandler(error));
  }
};
