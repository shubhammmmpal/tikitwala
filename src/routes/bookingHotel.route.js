import express from 'express';
import {
 
  createHotelBooking,
  getAllHotelBookings,
  getMyHotelBookings,
  getHotelBookingById,
  updateHotelBookingStatus,
  markCheckIn,
    // cancelBooking,
  
} from '../controllers/bookingHotel.controller.js';
// import { getAllBookings, updateBookingStatus, markCheckIn } from '../controllers/bookingHotel.controller.js';
// import { protect } from '../middleware/authMiddleware.js';
import { protect } from "../middleware/authMiddleware.js";  

const router = express.Router();

// router.use(protect); // All booking routes require authentication

router.post('/',protect, createHotelBooking);
router.get('/', getMyHotelBookings);
router.get('/:id', getHotelBookingById);
// router.patch('/:id/cancel', cancelBooking);
// router.get('/admin', protect, restrictTo('ADMIN'), getAllBookings);
// router.patch('/admin/:id/status', protect, restrictTo('ADMIN'), updateBookingStatus);
// router.patch('/admin/:id/checkin', protect, restrictTo('ADMIN'), markCheckIn);
router.get('/admin', getAllHotelBookings);
router.patch('/admin/:id/status', updateHotelBookingStatus);
router.patch('/admin/:id/checkin', markCheckIn);

export default router;