// routes/carRentRoutes.js

import express from "express";

import {
  createCarRent,
  getAllCarList,
  getCarById,
  updateCar,
  deleteCar,
} from "../controllers/carRent.controller.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();


// =========================
// Create Car
// =========================
router.post( 
  "/create",
  upload("cars").array("images", 10),
  createCarRent
);


// =========================
// Get All Cars
// =========================
router.get("/list", getAllCarList);


// =========================
// Get Car By Id
// =========================
router.get("/:id", getCarById);


// =========================
// Update Car
// =========================
router.put(
  "/update/:id",
  upload("cars").array("images", 10),
  updateCar
);


// =========================
// Delete Car
// =========================
router.delete("/delete/:id", deleteCar);

export default router;