const { errorHandler, errorCode } = require("../error/errorsHandler");
const News = require("../models/news");
const { deleteFile } = require("../util/file");
const { pagination } = require("../util/pagination");

exports.postNews = async (req, res, next) => {
  try {
    const { title, topic } = req.body;
    const poster = req.file.path;
    if (!poster) {
      const message = "Please upload poster";
      errorCode(message, 400);
    }
    await News.create({ topic: topic, poster: poster, title: title });
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
    let { topic, poster } = req.body;
    poster = poster ? poster : req.file?.path;
    const news = await News.findByIdAndUpdate(newsId, {
      topic: topic,
      poster: poster,
    }).lean();

    if (req.file) {
      deleteFile(news.poster);
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
    deleteFile(news.poster);
    res.status(200).json("Deleted");
  } catch (error) {
    next(errorHandler(error));
  }
};
