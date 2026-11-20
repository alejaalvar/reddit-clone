import Community from '../models/Community.js';
import Post from '../models/Post.js';
import HttpError from '../utils/HttpError.js';

const SORTS = {
  new: { createdAt: -1, _id: -1 },
  top: { score: -1, createdAt: -1, _id: -1 },
};

export default async function getFeed({
  community, sort = 'new', page = 1, limit = 25,
}) {
  if (!Object.hasOwn(SORTS, sort)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'sort must be new or top');
  }
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 50);

  const filter = {};
  if (community) {
    const found = await Community
      .findOne({ name: String(community).toLowerCase() }, '_id')
      .lean();
    if (!found) throw new HttpError(404, 'NOT_FOUND', 'Community not found');
    filter.community = found._id;
  }

  const docs = await Post.find(filter, '-body') // the feed shows titles only
    .sort(SORTS[sort])
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize + 1) // one extra tells us whether there is a next page
    .populate('author', 'username')
    .populate('community', 'name')
    .lean();

  const hasMore = docs.length > pageSize;
  // TODO(voting PR): look up the logged-in user's votes and set myVote per post.
  const posts = docs.slice(0, pageSize).map((post) => ({ ...post, myVote: 0 }));

  return { posts, page: pageNumber, hasMore };
}
