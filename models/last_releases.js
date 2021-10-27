const { Schema, Types, model } = require("mongoose");

const lastReleases = new Schema(
  {
    manga: {
      type: Types.ObjectId,
      ref: "Manga",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    chapter: {
      type: Types.ObjectId,
      required: true,
    },
    chapterNum: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Release", lastReleases);
