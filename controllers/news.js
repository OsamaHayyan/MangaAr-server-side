const { errorHandler, errorCode } = require("../error/errorsHandler");
const News = require("../models/news");
const { deleteDirAndFiles } = require("../util/file");
const { pagination } = require("../util/pagination");
const { webpConvertion } = require("../util/webpConvertion");

exports.postNews = async (req, res, next) => {
  try {
    const { title, topic } = req.body;
    const poster = req.file.path;
    if (!poster) {
      const message = "Please upload poster";
      errorCode(message, 400);
    }
    const webpPoster = await webpConvertion("news", poster);
    await News.create({ topic: topic, poster: webpPoster, title: title });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.getAllNews = async (req, res, next) => {
  try {
    const pageNum = req.query?.page || 1;
    const { skip, PAGE_SIZE } = await pagination(pageNum, 20);
    const newsCount = await News.estimatedDocumentCount().lean();
    const newsPages = Math.ceil(newsCount / 20);
    let news = await News.find()
      .skip(skip)
      .limit(PAGE_SIZE)
      .sort({ createdAt: -1 })
      .lean();
    news = { news: news, newsPages: newsPages };
    res.status(200).json(news);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.getNews = async (req, res, next) => {
  try {
    const newsId = req.params.newsId;
    const news = await News.findById(newsId).lean();
    if (!news) {
      const message = "News not found";
      errorCode(message, 400);
    }
    res.status(200).json(news);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.putNews = async (req, res, next) => {
  try {
    const newsId = req.params.newsId;
    const { title, topic } = req.body;
    const poster = req.file
      ? await webpConvertion("news", req.file.path)
      : undefined;
    const news = await News.findByIdAndUpdate(newsId, {
      title: title,
      topic: topic,
      poster: poster,
    }).lean();

    if (req.file) {
      await deleteDirAndFiles(news.poster);
    }

    res.status(200).json(news);
  } catch (error) {
    next(errorHandler(error));
  }
};

exports.deleteNews = async (req, res, next) => {
  try {
    const newsId = req.params.newsId;
    const news = await News.findByIdAndDelete(newsId).lean();
    await deleteDirAndFiles(news.poster);
    res.status(200).json("Deleted");
  } catch (error) {
    next(errorHandler(error));
  }
};
