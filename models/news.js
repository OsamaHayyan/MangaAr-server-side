const { Schema, Types, model } = require("mongoose");

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

module.exports = model("News", newsSchema);
