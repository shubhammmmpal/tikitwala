import express from 'express';
import {
  validateCoupon,
  // createCoupon,
  getAllCoupons,
  // updateCoupon,
  applyCoupon,



  createCoupon,
  updateCoupon,
  getCouponById,
  deleteCoupon
} from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();



// CREATE COUPON
router.post('/create',protect, createCoupon);

// UPDATE COUPON
router.put('/update/:id',protect, updateCoupon);

// GET COUPON BY ID
router.get('/:id',protect, getCouponById);

// DELETE COUPON
router.delete('/delete/:id',protect, deleteCoupon);

// Public / Authenticated
// router.post('/validate', protect, validateCoupon);
// router.post('/apply', protect, validateCoupon);   // Alias

// Admin Only
// router.use(protect);
// router.use(restrictTo('ADMIN'));
// router.post('/',protect, createCoupon);
router.post("/apply",protect, applyCoupon);
router.get('/', getAllCoupons);
// router.put('/:id', updateCoupon);

export default router;