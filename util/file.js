import { rm } from "fs/promises";
import path from "path";
import { errorCode } from "../error/errorsHandler.js";
import __dirname from "./__dirname.js";

export const deleteDirAndFiles = async (dirOrFile) => {
  try {
    if (Array.isArray(dirOrFile)) {
      for await (d of dirOrFile) {
        if (d == null) return;
        d = path.join(__dirname, "..", d);
        await rm(d, { recursive: true });
      }
    } else {
      if (dirOrFile == null) return;
      dirOrFile = path.join(__dirname, "..", dirOrFile);
      await rm(dirOrFile, { recursive: true });
    }
  } catch (error) {
    return errorCode(error, 500);
  }
};
