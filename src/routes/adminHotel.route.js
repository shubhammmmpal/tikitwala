import express from 'express';
import {
  createHotel,
  updateHotel,
  deleteHotel,
  updateHotelStatus,getMyHotelInventories
} from '../controllers/hotel.controller.js';
// import { protect, restrictTo } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// Protect all admin routes
// router.use(protect);
// router.use(restrictTo('ADMIN'));

router.post(
  "/",protect,
  upload("hotels").array("images", 10),
  createHotel
);
router.put(
  "/:id",
  upload("hotels").array("images", 10),
  updateHotel
);
router.delete('/:id', deleteHotel);
router.patch('/:id/status', updateHotelStatus);
router.get("/my-inventories", protect, getMyHotelInventories);

export default router;