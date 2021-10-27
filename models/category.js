const { Schema, Types, model } = require("mongoose");

const catSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  catManga: [
    {
      type: Types.ObjectId,
      ref: "Manga",
    },
  ],
});

module.exports = model("Category", catSchema);
