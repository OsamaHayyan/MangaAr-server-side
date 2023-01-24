import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

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

export default model("Release", lastReleases);
