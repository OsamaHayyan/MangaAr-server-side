import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

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

export default model("Category", catSchema);
