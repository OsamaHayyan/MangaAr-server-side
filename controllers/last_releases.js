import { errorHandler } from "../error/errorsHandler.js";
import last_releases from "../models/last_releases.js";
import Manga from "../models/manga.js";
import pagination from "../util/pagination.js";

export const lastReleases = async (req, res, next) => {
  try {
    // const pageNum = req.query?.page || 1;
    // const { skip, PAGE_SIZE } = await pagination(pageNum, 18);
    const manga = await Manga.find()
      .sort({ updatedAt: -1 })
      .limit(18)
      .populate("category", "category")
      .select({
        title: 1,
        rate: 1,
        image: 1,
        category: { $slice: 3 },
        chapters: { $slice: -3 },
      });

    const filteredManga = manga.filter((item) => item.chapters.length > 0);
    // const releases = await last_releases
    //   .find()
    //   .populate("manga", "rate category")
    //   .populate({
    //     path: "manga",
    //     populate: {
    //       path: "category",
    //       select: "category",
    //     },
    //   })
    //   .skip(skip)
    //   .limit(PAGE_SIZE)
    //   .sort({ createdAt: -1 });
    // // .lean();
    // const sortedReleases = new Map();
    // releases.some((item) => {
    //   if (sortedReleases.size > 18) return true;
    //   if (sortedReleases.has(item.title)) {
    //     const prevValue = sortedReleases.get(item.title) || [];
    //     if (prevValue.chapter?.length >= 3) return null;
    //     sortedReleases.set(item.title, {
    //       ...prevValue,
    //       chapter: [
    //         ...prevValue.chapter,
    //         { chapter: item.chapter, chapterNum: item.chapterNum },
    //       ],
    //     });
    //   } else {
    //     sortedReleases.set(item.title, {
    //       _id: item._id,
    //       mangaId: item.manga._id,
    //       rate: item.manga.rate,
    //       category: item.manga.category,
    //       title: item.title,
    //       image: item.image,
    //       chapter: [{ chapter: item.chapter, chapterNum: item.chapterNum }],
    //     });
    //   }
    // });

    res.status(200).json(filteredManga);
  } catch (error) {
    next(errorHandler(error));
  }
};
