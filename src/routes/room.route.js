import express from 'express';
import {
  getHotelRooms,
  checkRoomAvailability
} from '../controllers/room.controller.js';

const router = express.Router();

// Public Routes
router.get('/hotels/:hotelId/rooms', getHotelRooms);
router.get('/rooms/:roomId/availability', checkRoomAvailability);

export default router;