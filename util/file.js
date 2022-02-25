const { rm } = require("fs/promises");
const path = require("path");
const { errorCode } = require("../error/errorsHandler");

exports.deleteDirAndFiles = async (dirOrFile) => {
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
