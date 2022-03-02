const path = require("path");
const { errorCode, errorHandler } = require("../error/errorsHandler");
const Auther = require("../models/auther");
const Manga = require("../models/manga");
const Category = require("../models/category");
const last_releases = require("../models/last_releases");
const User = require("../models/user");

const { deleteDirAndFiles } = require("../util/file");
const { isObjectId } = require("../util/is_objectId");
const { pagination } = require("../util/pagination");
const { webpConvertion } = require("../util/webpConvertion");

// Order of sending text inputs and Images is too important ==>  Text input first then Images

exports.createManga = async (req, res, next) => {
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
      .select("-updatedAt -__v -createdAt -chapters.chapter");

    manga.rate = await manga.rate;
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
      .select("chapters image banner category auther")
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
    await last_releases.deleteMany({ manga: mangaId }).lean();

    await User.updateMany(
      { $or: [{ favorite: mangaId }, { "recent.manga": mangaId }] },
      { $pull: { recent: { manga: mangaId }, favorite: mangaId } }
    ).lean();

    const mangaImage = path.join(manga.image);
    const mangaBanner = manga.banner ? path.join(manga.banner) : null;
    console.log(mangaBanner);
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
    const rating = req.body.rate; //number of star which was checked in client-side
    const mangaId = req.params.mangaId;
    const possibleResult = ["1", "2", "3", "4", "5"];
    const rateCheck = possibleResult.includes(rating.toString()); //check if valid rate
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

    if (!updateRate) {
      return errorCode("Manga not found", 404);
    }
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
    if (!rating) {
      return errorCode("Manga not found", 404);
    }
    const rateResult = await rating.rate;
    res.status(200).json(rateResult);
  } catch (error) {
    next(errorHandler(error));
  }
};
