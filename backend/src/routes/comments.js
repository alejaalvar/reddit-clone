import express from "express";
import Comment from "../models/Comment.js";
//import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

//create comment
router.post("/", auth, async (req, res) => {
  try {
    const { body, postId } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      body,
      post: postId,
      author: req.user.id,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "username",
    );

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

//get comments from post
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
    })
      .populate("author", "username")
      .sort({
        createdAt: -1,
      });

    res.json(comments);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});
