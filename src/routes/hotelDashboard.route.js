import express from "express";
import { getHotelAgentDashboard } from "../controllers/hotelDashboard.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  getHotelAgentDashboard
);


export default router;