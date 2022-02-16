const fs = require("fs");
const fsPromise = require("fs/promises");
const path = require("path");
const { errorCode } = require("../error/errorsHandler");
exports.deleteFile = async (filePath) => {
  try {
    if (Array.isArray(filePath)) {
      filePath.forEach((f) => {
        if (f != null) {
          f = path.join(__dirname, "..", f);
          fsPromise.rm(f, { recursive: true });
        }
      });
    } else {
      filePath = path.join(__dirname, "..", filePath);
      fsPromise.rm(filePath, { recursive: true });
    }
  } catch (error) {
    return errorCode(error, 500);
  }
};

exports.deleteDir = async (dir) => {
  try {
    if (Array.isArray(dir)) {
      for await (d of dir) {
        if (d == null) return;
        d = path.join(__dirname, "..", d);
        fsPromise.rm(d, { recursive: true });
      }
    } else {
      if (d == null) return;
      dir = path.join(__dirname, "..", dir);
      fsPromise.rm(dir, { recursive: true });
    }
  } catch (error) {
    return errorCode(error, 500);
  }
};
