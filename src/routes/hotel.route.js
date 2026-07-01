import express from 'express';
import {
  searchHotels,
  nearbyHotels,
  getHotelById,
  getHotelRooms,
  advancedHotelSearch,
} from '../controllers/hotel.controller.js';

const router = express.Router();

// Public Routes
router.get('/', searchHotels);
router.post('/search', advancedHotelSearch);
router.get('/nearby', nearbyHotels);
router.get('/:id', getHotelById);
router.get('/:id/rooms', getHotelRooms);



export default router;