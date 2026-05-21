import express from 'express';
import {
  // createReview,
  // getHotelReviews,
  // getMyReviews,
  createReview,
   updateReview,
  deleteReview,
  getReviewsByUser,
  getReviewsByEntity,
  getReviewByBookingId,
} from '../controllers/review.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// CREATE REVIEW
// ==========================================

router.post("/create",
  //  protect, 
   createReview);

// ==========================================
// UPDATE REVIEW
// ==========================================

router.put(
  "/update/:reviewId",
  // protect,
  updateReview
);

// ==========================================
// DELETE REVIEW
// ==========================================

router.delete(
  "/delete/:reviewId",
  // protect,
  deleteReview
);

// ==========================================
// GET REVIEWS BY USER
// ==========================================

router.get(
  "/user/:userId",
  getReviewsByUser
);

// ==========================================
// GET REVIEWS BY ENTITY
// ==========================================

router.get(
  "/entity/:entityId",
  getReviewsByEntity
);

// ==========================================
// GET REVIEW BY BOOKING
// ==========================================

router.get(
  "/booking/:bookingId",
  getReviewByBookingId
);
// router.post('/', protect, createReview);
// router.get('/hotels/:hotelId/reviews', getHotelReviews);
// router.get('/my/reviews', protect, getMyReviews);

export default router;