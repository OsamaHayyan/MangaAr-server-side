export const errorCode = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const errorHandler = (error) => {
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  return error;
};
