const { Schema, Types, model } = require("mongoose");

const autherSchema = new Schema({
  autherName: {
    type: String,
    required: true,
  },
  autherManga: [
    {
      type: Types.ObjectId,
      ref: "Manga",
    },
  ],
});

// autherSchema.index({ autherName: "text" });
module.exports = model("Auther", autherSchema);
