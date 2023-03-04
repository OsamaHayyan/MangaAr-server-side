import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
    recent: [
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
    ],
    favorite: [
      {
        type: Types.ObjectId,
        ref: "Manga",
      },
    ],
    rate: [
      {
        mangaId: {
          type: Types.ObjectId,
          ref: "Manga",
        },
        rateNum: Number,
      },
    ],
    admin: {
      type: Boolean,
      required: true,
      default: false,
    },
    superuser: {
      type: Boolean,
      required: true,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiration: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default model("User", userSchema);
