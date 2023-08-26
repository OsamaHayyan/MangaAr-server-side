import fs from "fs";
import __dirname from "./__dirname.js";
import { deleteDirAndFiles } from "./file.js";
import ImageKit from "imagekit";
import dotenv from "dotenv";
import { errorCode } from "../error/errorsHandler.js";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: "public_vIfkSNqPfFacM12TOb8bVoGp0Ss=",
  privateKey: process.env.ImageKit_PrivateKey,
  urlEndpoint: "https://ik.imagekit.io/ziosx2001",
});

export const uploadImage = async (imagePath, imageName, imageFolder) => {
  try {
    if (!imagePath) throw new Error("Image Path or image id not specified");
    const imageFile = await fs.promises.readFile(imagePath, {
      encoding: "base64",
    });
    const imageUrl = await imagekit.upload({
      file: imageFile,
      fileName: imageName,
      folder: imageFolder,
      responseFields: "url",
    });

    await deleteDirAndFiles(imagePath);
    return imageUrl;
  } catch (error) {
    console.log(error);
    errorCode("Internal Server", 500);
  }
};

export const putImage = async (
  imagePath,
  imageName,
  imageFolder,
  oldImageId
) => {
  try {
    if (!imagePath || !oldImageId)
      throw new Error("Image Path or image id not specified");
    const imageFile = await fs.promises.readFile(imagePath, {
      encoding: "base64",
    });
    const imageUrl = await imagekit.upload({
      file: imageFile,
      fileName: imageName,
      folder: imageFolder,
      responseFields: "url",
    });
    await imagekit.deleteFile(oldImageId);

    await deleteDirAndFiles(imagePath);
    return imageUrl;
  } catch (error) {
    console.log(error);
    errorCode("Internal Server", 500);
  }
};

export const deleteImage = async (imageId) => {
  try {
    if (!imageId) throw new Error("please provid the image id");
    await imagekit.deleteFile(imageId);
  } catch (error) {
    console.log(error);
    errorCode("Internal Server", 500);
  }
};

export const deleteFolder = async (dir) => {
  try {
    if (!dir) throw new Error("please provid the image id");
    await imagekit.deleteFolder(dir);
  } catch (error) {
    console.log(error);
    errorCode("Internal Server", 500);
  }
};
