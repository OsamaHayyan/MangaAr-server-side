import path from "path";
import { writeFile } from "fs/promises";
import sharp from "sharp";
import { errorCode } from "../error/errorsHandler.js";
import { deleteDirAndFiles } from "./file.js";

const webpConvertion = async (basePath, image, banner) => {
  try {
    if (image && banner) {
      let container = [image, banner];
      let resultPaths = [];
      for await (const img of container) {
        let filePath =
          path.extname(img) == ".webp"
            ? path.join(img)
            : await imageConvertion(img, basePath);
        resultPaths.push(filePath);
      }
      return resultPaths;
    } else if (image && !banner) {
      return path.extname(image) == ".webp"
        ? path.join(image)
        : await imageConvertion(image, basePath);
    }
  } catch (error) {
    errorCode(error, 500);
  }
};

//helper method
const imageConvertion = async (image, basePath) => {
  const webpImage = await sharp(image).webp({ quality: 60 }).toBuffer();
  const newImageExtention = `${path.parse(image).name}.webp`;
  const imageFullPath = path.join("public", basePath, newImageExtention);
  await deleteDirAndFiles(image);
  await writeFile(imageFullPath, webpImage);
  return imageFullPath;
};

export default webpConvertion;
