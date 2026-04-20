import express from 'express';
import {
  createHotel,
  updateHotel,
  deleteHotel,
  updateHotelStatus
} from '../controllers/hotel.controller.js';
// import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin routes
// router.use(protect);
// router.use(restrictTo('ADMIN'));

router.post('/', createHotel);
router.put('/:id', updateHotel);
router.delete('/:id', deleteHotel);
router.patch('/:id/status', updateHotelStatus);

export default router;