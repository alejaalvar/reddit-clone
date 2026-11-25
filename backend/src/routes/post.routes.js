import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createPost, listPosts } from '../controllers/post.controller.js';

const router = Router();

// TODO(voting PR): add optionalAuth to the feed so each post can carry myVote
router.get('/', listPosts);
router.post('/', requireAuth, createPost);

export default router;
