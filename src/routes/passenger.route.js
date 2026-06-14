import express from "express";

import {
  createPassenger,
  getPassengers,
  getPassengerById,
  updatePassenger,
  deletePassenger
} from "../controllers/passenger.controller.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createPassenger);

router.get("/", protect, getPassengers);

router.get("/:id", protect, getPassengerById);

router.put("/:id", protect, updatePassenger);

router.delete("/:id", protect, deletePassenger);

export default router;