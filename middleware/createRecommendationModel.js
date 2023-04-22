import { PythonShell } from "python-shell";
import { errorHandler } from "../error/errorsHandler.js";
import Manga from "../models/manga.js";
import { writeFile } from "fs/promises";
import __dirname from "../util/__dirname.js";
import path from "path";
const createRecommendationModel = async (req, res, next) => {
  try {
    //get all comics titles, author name and category
    const allManga = await Manga.find()
      .select("title")
      .populate("auther category", "category autherName -_id");
    //clear data for analysis
    let newData = [];
    for (let index = 0; index < 10000; index++) {
      const element = allManga[index];
      const clearedTitle = element.title
        .trim()
        .toLowerCase()
        .replaceAll(" ", "");
      const clearedCategory = element.category
        .map((cat) => cat.category.trim().toLowerCase().replaceAll(" ", ""))
        .join(" ");
      const clearedAuthers =
        element.auther
          ?.map((auth) =>
            auth.autherName.trim().toLowerCase().replaceAll(" ", "")
          )
          .join(" ") || "";
      const clearedData = `${clearedTitle} ${clearedCategory} ${clearedAuthers}`;

      newData.push({
        _id: element._id,
        soup: clearedData,
      });
    }
    const mangaJson = JSON.stringify(newData);
    await writeFile(
      path.join(__dirname(import.meta.url), "..", "models", "mangaList.json"),
      mangaJson
    );
    await PythonShell.run("util/createModel.py", {
      mode: "text",
    });
    return res.sendStatus(200);
  } catch (error) {
    next(errorHandler(error));
  }
};

export default createRecommendationModel;
