const path = require("path");
const { errorCode } = require("../error/errorsHandler");

const { writeFile } = require("fs/promises");
const sharp = require("sharp");
const { deleteFile } = require("./file");

exports.webpConvertion = async (basePath, image, banner) => {
  try {
    if (image && banner) {
      let container = [image, banner];
      let resultPaths = [];
      for await (img of container) {
        let path = await imageConvertion(img, basePath);
        resultPaths.push(path);
      }
      return resultPaths;
    } else if (image && !banner) {
      return await imageConvertion(image, basePath);
    }
  } catch (error) {
    errorCode(error, 500);
  }
};

//helper method
const imageConvertion = async (image, basePath) => {
  const webpImage = await sharp(image).webp({ quality: 60 }).toBuffer();
  const newImageExtention = `${path.parse(image).name}.webp`;
  const imageFullPath = path.join("public/", basePath, newImageExtention);
  await deleteFile(image);
  await writeFile(imageFullPath, webpImage);
  return imageFullPath;
};
