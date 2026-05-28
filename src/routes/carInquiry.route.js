// routes/carInquiryRoutes.js

import express from "express";

import {
  createCarInquiry,
  getAllCarInquiry,
  getCarInquiryByID,
  deleteCarInquiry,
  getCarInquiryByUserId,
} from "../controllers/carInquiry.controller.js";

const router = express.Router();


// Create Inquiry
router.post("/create", createCarInquiry);


// Get All Inquiry
router.get("/list", getAllCarInquiry);


// Get Inquiry By ID
router.get("/:id", getCarInquiryByID);


// Get Inquiry By User ID
router.get("/user/:userId", getCarInquiryByUserId);


// Delete Inquiry
router.delete("/delete/:id", deleteCarInquiry);

export default router;