import fs from "fs";
import path from "path";
import __dirname from "./__dirname.js";
import axios from "axios";
import FormData from "form-data";
import { deleteDirAndFiles } from "./file.js";

const uploadedImageUrl = async (image) => {
  try {
    const rawImage = new FormData();
    rawImage.append(
      "source",
      fs.createReadStream(path.join(__dirname(import.meta.url), "..", image))
    );

    const uploadedImage = await axios.post(
      "https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5",
      rawImage
    );

    await deleteDirAndFiles(image);
    return uploadedImage.data.image.url;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
    }
  }
};

export default uploadedImageUrl;
