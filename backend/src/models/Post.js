// temp

import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },

    score: {
      type: Number,
      default: 0,
    },

    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        value: {
          type: Number,
          enum: [1, -1],
        },
      },
    ],
  },
  { timestamps: true },
);

// module.exports = mongoose.model("Post", postSchema);

const Post = mongoose.model("Post", postSchema);

export default Post;
