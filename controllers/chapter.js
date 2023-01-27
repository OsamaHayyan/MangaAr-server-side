import sharp from "sharp";
import path from "path";
import slices from "slices";
import Manga from "../models/manga.js";
import User from "../models/user.js";
import last_releases from "../models/last_releases.js";
import { deleteDirAndFiles } from "../util/file.js";
import { isObjectId } from "../util/is_objectId.js";
import { errorCode, errorHandler } from "../error/errorsHandler.js";

export const createChapter = async (req, res, next) => {
  try {
    const mangaId = req.body.mangaId;
    const chapterNum = req.body.chapterNum;
    const chapterName = req.body.name ? req.body.name : chapterNum;
    const date = new Date().toISOString().split("T")[0];
    const chapter = req.files
      .map((c) => c.path)
      .sort((a, b) => {
        return path.parse(a).name - path.parse(b).name;
      });

    if (req.files.length <= 0) {
      const message = "Please add Chapter pages";
      return errorCode(message, 400);
    }

    let page = 1;
    let images = [];
    for await (const c of chapter) {
      try {
        let count = 1;
        let image = sharp(c);

        const { height, width, type } = await image.metadata().then((d) => {
          return { height: d.height, width: d.width, type: d.format };
        });

        const Height1 = height / 3;
        const Height2 = Height1 * 2;
        const Width1 = width / 3;
        const Width2 = Width1 * 2;

        const blocks = slices(
          width,
          height,
          [Height1, Height2],
          [Width1, Width2]
        );

        blocks.forEach((b) => {
          const date = new Date().toISOString().replace(/:/g, "-");
          sharp(c)
            .extract({
              left: parseInt(b.x),
              top: parseInt(b.y),
              width: parseInt(b.width),
              height: parseInt(b.height),
            })
            .webp({ quality: 80 })
            .toFile(
              path.join(
                "public",
                "chapters",
                mangaId,
                chapterNum,
                `page_${page}-${count}-${date}.webp`
              )
            );
          images.push(
            path.join(
              "public",
              "chapters",
              mangaId,
              chapterNum,
              `page_${page}-${count}-${date}.webp`
            )
          );
          count++;
        });

        page++;
      } catch (error) {
        next(errorHandler(error));
      }
    }

    const manga = await Manga.findOneAndUpdate(
      { _id: mangaId },
      {
        $push: {
          chapters: {
            chapterNum: chapterNum,
            name: chapterName,
            chapter: images,
            date: date,
          },
        },
      },
      { new: true }
    ).lean();

    await last_releases.create({
      manga: mangaId,
      chapter: manga.chapters[manga.chapters.length - 1]._id,
      chapterNum: manga.chapters[manga.chapters.length - 1].chapterNum,
      title: manga.title,
      image: manga.image,
    });

    setTimeout(async () => {
      await deleteDirAndFiles(chapter);
    }, 500);

    res.status(200).json("succes");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAllChapters = async (req, res, next) => {
  try {
    const mangaId = req.params.mangaId;
    await isObjectId(mangaId);
    const chapters = await Manga.findById(mangaId).select("chapters").lean();
    return res.status(200).json(chapters);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getChapter = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const mangaId = req.body.mangaId;
    const chapterId = req.params.chapterId;

    if (!mangaId || !chapterId) {
      const message = "insert manga ID and chapter ID";
      return errorCode(message, 403);
    }

    await isObjectId([mangaId, chapterId]);

    const manga = await Manga.findOneAndUpdate(
      { _id: mangaId, "chapters._id": chapterId },
      { $inc: { "chapters.$.views": 1, views: 1 } }
    )
      .select("chapters.$ image title")
      .lean();

    if (!manga) {
      const message = "not found";
      errorCode(message, 400);
    }

    if (userId && req.user.superuser === false) {
      const chapterRecentExist = await User.exists({
        _id: userId,
        "recent.chapter": manga.chapters[0]._id,
      });

      if (!chapterRecentExist) {
        await User.updateOne(
          { _id: userId },
          {
            $push: {
              recent: {
                manga: mangaId,
                chapter: manga.chapters[0]._id,
                chapterNum: manga.chapters[0].chapterNum,
                title: manga.title,
                image: manga.image,
              },
            },
          }
        );

        const recentCount = await User.exists({
          _id: userId,
          recent: { $size: 11 },
        });
        if (recentCount) {
          await User.updateOne({ _id: userId }, { $pop: { recent: -1 } });
        }
      }
    }
    return res.status(200).json(manga);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const mangaId = req.body.mangaId;
    const chapterId = req.params.chapterId;
    if (!mangaId || !chapterId) {
      const message = "insert manga ID and chapter ID";
      return errorCode(message, 403);
    }

    await isObjectId([mangaId, chapterId]);

    const manga = await Manga.findOneAndUpdate(
      { _id: mangaId, "chapters._id": chapterId },
      { $pull: { chapters: { _id: chapterId } } }
    )
      .select("chapters.$ -_id")
      .lean();
    if (!manga) {
      const message = "not found";
      errorCode(message, 400);
    }

    await User.updateMany(
      { "recent.chapter": chapterId },
      { $pull: { recent: { chapter: chapterId } } }
    );

    await last_releases
      .deleteOne({ manga: mangaId, chapter: chapterId })
      .lean();

    const dirname = path.dirname(manga.chapters[0].chapter[0]);
    await deleteDirAndFiles(dirname);
    return res.status(200).json("deleted");
  } catch (error) {
    next(errorHandler(error));
  }
};
