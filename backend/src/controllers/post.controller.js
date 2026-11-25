import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import getFeed from '../services/feedService.js';
import HttpError from '../utils/HttpError.js';

export async function listPosts(req, res) {
  const {
    community, sort, page, limit,
  } = req.query;
  res.json(await getFeed({
    community, sort, page, limit,
  }));
}

export async function createPost(req, res) {
  const { communityId, title, body } = req.body;

  const fields = {};
  if (typeof communityId !== 'string' || !communityId) {
    fields.communityId = 'communityId is required';
  }
  if (typeof title !== 'string' || !title.trim()) {
    fields.title = 'title is required';
  }
  if (body !== undefined && typeof body !== 'string') {
    fields.body = 'body must be a string';
  }
  if (Object.keys(fields).length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some fields are invalid', fields);
  }

  const communityExists = mongoose.isValidObjectId(communityId)
    && await Community.exists({ _id: communityId });
  if (!communityExists) throw new HttpError(404, 'NOT_FOUND', 'Community not found');

  const post = await Post.create({
    title,
    body,
    community: communityId,
    author: req.user.id,
  });
  await post.populate([
    { path: 'author', select: 'username' },
    { path: 'community', select: 'name' },
  ]);

  res.status(201).json({ post: { ...post.toJSON(), myVote: 0 } });
}
