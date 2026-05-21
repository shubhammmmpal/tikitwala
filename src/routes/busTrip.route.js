
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
  updateSeatType
   } from '../controllers/busTrip.controller.js';

router.post("/create", createBusTrip);
router.get("/search", searchBusTrips);
router.get("/", getBusTrips);
router.get("/:id", getBusTripById);
router.put("/:id", updateBusTrip);
router.patch("/:id/status", changeBusTripStatus);
router.delete("/:id", deleteBusTrip);
router.patch("/update-seat-price", updateSeatPrice);
router.patch("/update-seat-type", updateSeatType);




export default router;