const jwt = require("jsonwebtoken");
const { errorHandler, errorCode } = require("../error/errorsHandler");
const User = require("../models/user");

exports.is_superuser = async (req, res, next) => {
  try {
    const token = await req.cookies.access_token;
    if (!token) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    const decodedToken = jwt.verify(token, process.env.SECRECT_KEY);

    if (!decodedToken) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    if (decodedToken.admin === false || decodedToken.superuser === false) {
      const message = "Not authorized";
      return errorCode(message, 401);
    }

    const user = await User.exists({ _id: decodedToken.userId });
    if (!user) {
      const message = "user not found";
      errorCode(message, 400);
    }
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.message = "Please Login again";
      error.statusCode = 401;
    }
    next(errorHandler(error));
  }
};

exports.is_admin = async (req, res, next) => {
  try {
    const token = await req.cookies.access_token;
    if (!token) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    const decodedToken = jwt.verify(token, process.env.SECRECT_KEY);
    if (!decodedToken) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    if (decodedToken.admin === false) {
      console.log("osama");
      const message = "Not authorized";
      return errorCode(message, 401);
    }

    const user = await User.exists({ _id: decodedToken.userId });
    if (!user) {
      const message = "user not found";
      errorCode(message, 400);
    }

    req.user = decodedToken;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.message = "Please Login again";
      error.statusCode = 401;
    }
    next(errorHandler(error));
  }
};

exports.is_auth = async (req, res, next) => {
  try {
    const token = await req.cookies.access_token;
    if (!token) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    const decodedToken = jwt.verify(token, process.env.SECRECT_KEY);
    if (!decodedToken) {
      const message = "Not authenticated";
      errorCode(message, 401);
    }

    const user = await User.exists({ _id: decodedToken.userId });
    if (!user) {
      const message = "user not found";
      errorCode(message, 400);
    }
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.message = "Please Login again";
      error.statusCode = 401;
    }
    next(errorHandler(error));
  }
};

exports.logedin = async (req, res, next) => {
  try {
    const token = await req.cookies.access_token;
    if (!token) {
      return next();
    }

    const decodedToken = jwt.verify(token, process.env.SECRECT_KEY);
    if (decodedToken) {
      req.user = decodedToken;
    }

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.message = "Please Login again";
      error.statusCode = 401;
      res.clearCookie("access_token");
    }
    next(errorHandler(error));
  }
};

exports.noLogedIn = async (req, res, next) => {
  try {
    const token = await req.cookies.access_token;
    if (token) {
      return errorCode("Faild to fetch", 401);
    }
    return next();
  } catch (error) {
    next(errorHandler(error));
  }
};
