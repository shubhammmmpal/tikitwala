import express from 'express';
import {
  createReview,
  getHotelReviews,
  getMyReviews
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/hotels/:hotelId/reviews', getHotelReviews);
router.get('/my/reviews', protect, getMyReviews);

export default router;