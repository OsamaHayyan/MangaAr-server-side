import mongoose from "mongoose";
const { Schema, Types, model } = mongoose;

const mangaSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: "text",
    },
    category: [
      {
        type: Types.ObjectId,
        required: true,
        ref: "Category",
      },
    ],
    story: {
      type: String,
      require: true,
    },
    image: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    auther: [
      {
        type: Types.ObjectId,
        ref: "Auther",
        default: null,
      },
    ],
    chapters: [
      {
        chapterNum: {
          type: String,
          required: true,
        },
        name: {
          type: String,
        },
        chapter: {
          type: Array,
          required: true,
        },
        views: {
          type: Number,
          default: 0,
        },
        date: {
          type: String,
          required: true,
        },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Schema.Types.Mixed,
      1: Number,
      2: Number,
      3: Number,
      4: Number,
      5: Number,
      default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      get: rateWeightedAverage,
    },
  },
  { toJSON: { getters: true }, timestamps: true }
);

function rateWeightedAverage(rate) {
  try {
    //every star = it's number
    //1=>1, star 2 => 2 starts ..etc
    //total starts = sum of all stars
    const totalRates = rate[1] + rate[2] + rate[3] + rate[4] + rate[5];
    //if no rates return zero rates
    if (totalRates == 0) return Number(0).toFixed(1);
    const sumOfRates =
      1 * rate[1] + 2 * rate[2] + 3 * rate[3] + 4 * rate[4] + 5 * rate[5];
    const rateResult = Number((sumOfRates / totalRates).toFixed(1));
    return rateResult;
  } catch (error) {
    throw new Error(error);
  }
}
// mangaSchema.index({ title: "text" });
export default model("Manga", mangaSchema);
