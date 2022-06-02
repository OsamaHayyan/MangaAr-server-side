const express = require("express");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const Manga = require("./routes/manga");
const Auther = require("./routes/auther");
const Chapters = require("./routes/chapter");
const Category = require("./routes/category");
const User = require("./routes/user");
const last_releases = require("./routes/last_releases");
const News = require("./routes/news");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
};

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(compression());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors(corsOptions));

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/last-release", last_releases);
app.use("/user", User);
app.use("/mangas", Manga);
app.use("/news", News);
app.use("/authers", Auther);
app.use("/chapters", Chapters);
app.use("/category", Category);

app.use(async (error, req, res, next) => {
  try {
    const status = error.statusCode || 500;
    let message = error.message;
    let data = error.data?.map((d) => ({ msg: d.msg, param: d.param }));
    if (!data) {
      data = [{ msg: "internal server error" }];
    }
    if (status === 500) {
      message = "Faild to fetch";
    }
    console.log(error);
    res
      .status(status)
      .json({ message: message, data: data, statusCode: status });
  } catch (error) {
    console.log(error);
    const message = "Faild to fetch";
    res.status(500).json({ message: message });
  }
});

const port = process.env.PORT || 8080;
const mongo = process.env.MONGODB_ATLAS;

(async () => {
  let maxTries = 2;
  try {
    maxTries -= 1;
    await mongoose.connect(mongo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("connected");
    return app.listen(port);
  } catch (error) {
    if (maxTries > 0) {
      maxTries -= 1;
      await mongoose.connect(mongo, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("connected");
      return app.listen(port);
    } else {
      throw error;
    }
  }
})();
