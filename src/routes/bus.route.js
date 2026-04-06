
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

// router.get('/buses', getBusList);
router.get('/search-buses', searchBuses);
// router.get('/debug-buses', debugBuses);
router.post("/create", createBus);
router.get("/", getBusList);
router.get("/:id", getBusById);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);
router.patch("/:id/status", changeBusStatus);
router.post("/:busId/generate-seats", generateBusSeats);



export default router;