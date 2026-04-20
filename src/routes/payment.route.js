import express from 'express';
import {
  initiatePayment,
  paymentWebhook,
  getMyTransactions
} from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.post('/webhook', paymentWebhook);           // No auth - public for Razorpay
router.get('/my-transactions', protect, getMyTransactions);

// Admin Routes
router.get('/admin', protect, restrictTo('ADMIN'), getAllPayments);
router.post('/admin/refund', protect, restrictTo('ADMIN'), processRefund);

export default router;