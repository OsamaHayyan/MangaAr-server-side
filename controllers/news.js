import News from "../models/news.js";
import { errorCode, errorHandler } from "../error/errorsHandler.js";
import { deleteDirAndFiles } from "../util/file.js";
import pagination from "../util/pagination.js";
import webpConvertion from "../util/webpConvertion.js";
import { deleteImage, putImage, uploadImage } from "../util/uploadImage.js";

export const postNews = async (req, res, next) => {
  try {
    const { title, topic } = req.body;
    const poster = req.file;
    if (!poster.path) {
      const message = "Please upload poster";
      errorCode(message, 400);
    }
    const webpPoster = await uploadImage(poster.path, poster.filename, "news");
    await News.create({
      topic: topic,
      poster: webpPoster.url,
      poster_id: webpPoster.fileId,
      title: title,
    });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAllNews = async (req, res, next) => {
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

export const getNews = async (req, res, next) => {
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

export const putNews = async (req, res, next) => {
  try {
    const newsId = req.params.newsId;
    const news = await News.findOne({ _id: newsId })
      .select("poster_id -_id")
      .lean();
    const { title, topic } = req.body;
    const poster = req.file
      ? await putImage(req.file.path, req.file.filename, "news", news.poster_id)
      : undefined;

    await News.findByIdAndUpdate(newsId, {
      title: title,
      topic: topic,
      poster: poster.url,
      poster_id: poster.fileId,
    }).lean();

    res.status(200).json(news);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteNews = async (req, res, next) => {
  try {
    const newsId = req.params.newsId;
    const news = await News.findByIdAndDelete(newsId).lean();
    await deleteImage(news.poster_id);
    res.status(200).json("Deleted");
  } catch (error) {
    next(errorHandler(error));
  }
};
