import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createCommunity,
  getCommunity,
  listCommunities,
} from '../controllers/community.controller.js';

const router = Router();

router.get('/', listCommunities);
router.post('/', requireAuth, createCommunity);
router.get('/:name', getCommunity);

export default router;
