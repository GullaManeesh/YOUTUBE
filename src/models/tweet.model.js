import mongoose from "mongoose";

const tweetSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamp: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
