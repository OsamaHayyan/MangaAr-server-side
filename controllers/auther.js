import { errorCode, errorHandler } from "../error/errorsHandler.js";
import Auther from "../models/auther.js";
import Manga from "../models/manga.js";

export const createAuther = async (req, res, next) => {
  try {
    const name = req.body.name;
    await Auther.create({ autherName: name });
    return res.status(200).json({ response: "Auther created" });
  } catch (error) {
    next(errorHandler(error));
  }
};
export const getAllAuthers = async (req, res, next) => {
  try {
    const auther = await Auther.find().select("autherName").lean();
    if (!auther) {
      const message = "auther not found";
      errorCode(message, 400);
    }

    return res.status(200).json(auther);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAuther = async (req, res, next) => {
  try {
    const autherId = req.params.autherId;

    const auther = await Auther.findById(autherId).populate(
      "autherManga",
      "title image date -_id"
    );
    if (!auther) {
      const message = "auther not found";
      errorCode(message, 400);
    }

    return res.status(200).json(auther);
  } catch (error) {
    next(errorHandler(error));
  }
};

// export const searchAuther = async (req, res, next) => {
//   try {
//     const query = req.body.query;
//     const auther = await Auther.find({ $text: { $search: query } }).select(
//       "-__v -autherManga"
//     );
//     return res.status(200).json(auther);
//   } catch (error) {
//     next(errorHandler(error));
//   }
// };

export const modifyAuther = async (req, res, next) => {
  try {
    const autherId = req.params.autherId;
    const name = req.body.name;

    const auther = await Auther.findByIdAndUpdate(autherId, {
      autherName: name,
    });

    if (!auther) {
      const message = "Auther not found";
      errorCode(message, 400);
    }
    return res.status(200).json({ response: "updated succesfully" });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteAuther = async (req, res, next) => {
  try {
    const autherId = req.params.autherId;

    const auther = await Auther.findByIdAndDelete(autherId)
      .select("_id")
      .lean();
    if (!auther) {
      const message = "auther not found";
      errorCode(message, 400);
    }
    await Manga.updateMany({ auther: autherId }, { auther: null });
    return res.status(200).json({ response: "Deleted Successfully" });
  } catch (error) {
    next(errorHandler(error));
  }
};
