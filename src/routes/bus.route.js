
import express from 'express';

const router = express.Router();

import { createBus,
  getBusList,
  getBusById,
  updateBus,
  deleteBus,
  changeBusStatus,
    generateBusSeats,searchBuses
} from '../controllers/bus.controller.js';

import { protect } from '../middleware/authMiddleware.js';   // Your auth middleware

import upload from '../middleware/uploadMiddleware.js';

const busUpload = upload("buses");


router.get('/buses', protect, getBusList);
router.get('/search-buses', searchBuses);
// router.get('/debug-buses', debugBuses);
router.post("/create", protect, busUpload.array("images", 10), createBus);

router.get("/:id", getBusById);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);
router.patch("/:id/status", changeBusStatus);
router.post("/:busId/generate-seats", generateBusSeats);



export default router;