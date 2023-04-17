import { errorHandler, errorCode } from "../error/errorsHandler.js";
import Category from "../models/category.js";
import Manga from "../models/manga.js";
import { isObjectId } from "../util/is_objectId.js";

export const createCategory = async (req, res, next) => {
  try {
    const cat = req.body.category;
    await Category.create({ category: cat });
    res.status(200).json("succes");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getCat = async (req, res, next) => {
  try {
    const catId = req.params.catId;

    const cat = await Category.findById(catId)
      .populate("catManga", "-chapters")
      .lean();

    if (!cat) {
      const message = "Please add a valid category";
      errorCode(message, 400);
    }
    res.status(200).json(cat);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAllCat = async (req, res, next) => {
  try {
    let category = await Category.find().select("category").lean();
    return res.status(200).json(category);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const modifyCat = async (req, res, next) => {
  try {
    const catId = req.params.catId;
    const catName = req.body.category;

    await Category.updateOne({ _id: catId }, { category: catName }).lean();
    res.status(200).json("Category Updated Successfully");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteCat = async (req, res, next) => {
  try {
    const catId = req.params.catId;
    if (!catId) {
      const message = "category not found";
      errorCode(message, 400);
    }
    await isObjectId(catId);
    const cat = await Category.findByIdAndDelete(catId)
      .select("catManga")
      .lean();
    if (!cat) {
      const message = "No valid category";
      errorCode(message, 400);
    }
    await Manga.updateMany(
      { _id: cat.catManga },
      { $pull: { category: cat._id } }
    );
    return res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};
