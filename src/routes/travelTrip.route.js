import express from "express";

import {
  createTravelTrip,
  getAllTravelTrips,
  getTravelTripById,
  updateTravelTrip,
  deleteTravelTrip,
} from "../controllers/travelTrip.controller.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

const travelTripUpload= upload("travelTrips");
// CREATE
router.post("/", travelTripUpload.array("images", 10),  createTravelTrip);

// GET ALL
router.get("/", getAllTravelTrips);

// GET BY ID
router.get("/:id", getTravelTripById);

// UPDATE
router.put("/:id", travelTripUpload.array("images", 10), updateTravelTrip);

// DELETE
router.delete("/:id", deleteTravelTrip);

export default router;