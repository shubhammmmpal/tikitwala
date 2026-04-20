import express from 'express';
import { createAgentHotelBooking } from '../controllers/bookingHotel.controller.js';
// import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// router.use(protect);
// router.use(restrictTo('AGENT'));

router.post('/bookings', createAgentHotelBooking);

export default router;