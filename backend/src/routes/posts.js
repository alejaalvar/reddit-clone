import express from "express";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();
// get post

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .populate("community", "name slug");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

//vote

router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { value } = req.body;

    if (![1, -1].includes(value)) {
      return res.status(400).json({
        message: "Invalid vote value",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const existingVote = post.votes.find(
      (vote) => vote.user.toString() === req.user.id,
    );

    if (!existingVote) {
      post.votes.push({
        user: req.user.id,
        value,
      });

      post.score += value;
    } else if (existingVote.value === value) {
      post.score -= value;

      post.votes = post.votes.filter(
        (vote) => vote.user.toString() !== req.user.id,
      );
    } else {
      post.score -= existingVote.value;

      existingVote.value = value;

      post.score += value;
    }

    await post.save();

    res.json({
      success: true,
      score: post.score,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});
