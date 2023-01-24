import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

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

export default model("Auther", autherSchema);
