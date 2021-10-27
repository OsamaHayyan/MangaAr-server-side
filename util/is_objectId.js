const { Types } = require("mongoose");
const { errorCode } = require("../error/errorsHandler");
const { deleteFile } = require("./file");

const ObjectId = Types.ObjectId;
exports.isObjectId = async (obj) => {
  const arrObj = Array.isArray(obj) ? obj : [obj];
  for await (el of arrObj) {
    if (ObjectId.isValid(el)) {
      const isObject = String(new ObjectId(el)) === el ? true : false;
      if (!isObject) {
        const message = "Please add valid data";
        errorCode(message, 400);
      }
    } else {
      const message = "Please add valid data";
      errorCode(message, 400);
    }
  }
};

const isObjectValid = async (obj) => {
  if (Array.isArray(obj)) {
    let result = [];
    for await (o of obj) {
      if (ObjectId.isValid(o)) {
        const isObject = String(new ObjectId(o)) === o ? true : false;
        if (!isObject) {
          result.push(isObject);
        } else if (isObject) {
          result.push(true);
        }
      } else {
        result.push(false);
      }
    }
    if (result.includes(false)) {
      return false;
    } else {
      return true;
    }
  } else {
    if (ObjectId.isValid(obj)) {
      const isObject = String(new ObjectId(obj)) === obj ? true : false;
      return isObject;
    } else {
      return false;
    }
  }
};

exports.isObjectIdExtra = async (auther, other, other2) => {
  if (other2) {
    if (
      (auther != null && !(await isObjectValid(auther))) ||
      !(await isObjectValid(other)) ||
      !(await isObjectValid(other2))
    ) {
      const message = "Please add valid data";
      return errorCode(message, 400);
    }
  } else {
    if (
      (auther != null && !(await isObjectValid(auther))) ||
      !(await isObjectValid(other))
    ) {
      const message = "Please add valid data";
      return errorCode(message, 400);
    }
  }
};
