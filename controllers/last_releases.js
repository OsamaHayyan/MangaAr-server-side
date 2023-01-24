import last_releases from "../models/last_releases.js";
import pagination from "../util/pagination.js";

export const lastReleases = async (req, res, next) => {
  try {
    const pageNum = req.query?.page || 1;
    const { skip, PAGE_SIZE } = await pagination(pageNum, 20);
    const releases = await last_releases
      .find()
      .skip(skip)
      .limit(PAGE_SIZE)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(releases);
  } catch (error) {
    next(errorHandler(error));
  }
};
