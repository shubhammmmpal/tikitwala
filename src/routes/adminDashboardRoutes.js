import express from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOccupancyReport,
  getBookingReports
} from '../controllers/adminDashboardController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/occupancy', getOccupancyReport);
router.get('/reports/bookings', getBookingReports);

export default router;