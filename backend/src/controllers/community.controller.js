import Community from '../models/Community.js';
import HttpError from '../utils/HttpError.js';

export async function listCommunities(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

  const docs = await Community.find()
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit + 1)
    .populate('creator', 'username')
    .lean();

  res.json({
    communities: docs.slice(0, limit),
    page,
    hasMore: docs.length > limit,
  });
}

export async function createCommunity(req, res) {
  const { name, description } = req.body;
  if (typeof name !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some fields are invalid', {
      name: 'name is required',
    });
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some fields are invalid', {
      description: 'description must be a string',
    });
  }

  // Schema validation and the unique index handle the rest (400 / 409)
  const community = await Community.create({
    name,
    description,
    creator: req.user.id,
  });
  await community.populate('creator', 'username');

  res.status(201).json({ community });
}

export async function getCommunity(req, res) {
  const community = await Community
    .findOne({ name: req.params.name.toLowerCase() })
    .populate('creator', 'username')
    .lean();
  if (!community) throw new HttpError(404, 'NOT_FOUND', 'Community not found');

  res.json({ community });
}
