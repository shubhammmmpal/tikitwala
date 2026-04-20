import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon
} from '../controllers/couponController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated
router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, validateCoupon);   // Alias

// Admin Only
router.use(protect);
router.use(restrictTo('ADMIN'));
router.post('/', createCoupon);
router.get('/', getAllCoupons);
router.patch('/:id', updateCoupon);

export default router;