
import express from 'express';

const router = express.Router();

import { createBusTrip,
  getBusTrips,
  getBusTripById,
  updateBusTrip,
  deleteBusTrip,
  changeBusTripStatus,
  searchBusTrips } from '../controllers/busTrip.controller.js';

router.post("/create", createBusTrip);
router.get("/search", searchBusTrips);
router.get("/", getBusTrips);
router.get("/:id", getBusTripById);
router.put("/:id", updateBusTrip);
router.patch("/:id/status", changeBusTripStatus);
router.delete("/:id", deleteBusTrip);





export default router;