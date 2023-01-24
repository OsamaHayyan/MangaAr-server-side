import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

const newsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default model("News", newsSchema);
