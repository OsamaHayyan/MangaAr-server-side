const { response } = require("express");

exports.errorCode = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

exports.errorHandler = (error) => {
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  return error;
};
