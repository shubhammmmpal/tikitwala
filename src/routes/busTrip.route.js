
import express from 'express';

const router = express.Router();

import { createBusTrip,
  getBusTrips,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
  changeBusTripStatus,
  searchBusTrips,
  updateSeatPrice,
  updateSeatType,
  getUpcomingTrips
   } from '../controllers/busTrip.controller.js';
import { protect } from '../middleware/authMiddleware.js';

router.post("/create",protect, createBusTrip);
router.get("/upcoming",protect, getUpcomingTrips);
router.get("/search", searchBusTrips);
router.get("/", getBusTrips);
router.get("/:id", getBusTripById);
router.put("/:id", updateBusTrip);
router.patch("/:id/status", changeBusTripStatus);
router.delete("/:id", deleteBusTrip);
router.patch("/update-seat-price", updateSeatPrice);
router.patch("/update-seat-type", updateSeatType);




export default router;